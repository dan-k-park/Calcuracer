import { Context } from "../types";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import UserModel, { User } from "../models/User";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "./../constants";
import argon2 from "argon2";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import mongoose from "mongoose";

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: Context) {
    // not logged in
    if (!req.session.userId) {
      return null;
    }

    return UserModel.findOne(req.session.userId);
  }

  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: Context) {
    if (req.session.userId.toString() === user._id) {
      return user.email;
    }
    // If current user is trying to see another user's email
    return "";
  }
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }
    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      const result = await UserModel.create({
        username: options.username,
        password: hashedPassword,
        email: options.email,
      });
      user = result;
    } catch (error) {
      if (error.code === 11000) {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }

    // This is so dumb haha
    req.session.userId = new mongoose.Types.ObjectId(user?._id);
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    const user = await UserModel.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
    console.log(user);
    if (!user) {
      return {
        errors: [{ field: "usernameOrEmail", message: "User does not exist." }],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [{ field: "password", message: "Incorrect password." }],
      };
    }
    req.session.userId = new mongoose.Types.ObjectId(user?._id);
    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: Context) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: Context
  ): Promise<UserResponse> {
    if (newPassword.length <= 8) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "Password must be greater than 8 characters.",
          },
        ],
      };
    }
    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "Token expired.",
          },
        ],
      };
    }
    // Need to make this work with objectid type
    const userIdNum = parseInt(userId);
    const user = await UserModel.findById(userIdNum);
    if (!user) {
      return {
        errors: [
          {
            field: "Token",
            message: "User no longer exists",
          },
        ],
      };
    }
    await UserModel.updateOne(
      { _id: userIdNum },
      { password: await argon2.hash(newPassword) }
    );
    // can't use token to change password again
    await redis.del(key);
    // log in user after change password
    req.session.userId = user.id;
    return { user };
  }
}
