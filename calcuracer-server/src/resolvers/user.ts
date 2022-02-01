import { Context } from "../types";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Resolver,
  Root,
} from "type-graphql";
import UserModel, { User } from "../models/User";
import { FORGET_PASSWORD_PREFIX } from "./../constants";
import argon2 from "argon2";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";

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
    @Arg("options") options: UsernamePasswordInput
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
      console.log(user);
    } catch (error) {
      console.error("Error: ", error);
      // duplicate username error
      // find error code after creating an error intentionally
      //  if (error.code === "23505") {
      //   return {
      //     errors: [
      //       {
      //         field: "username",
      //         message: "username already taken",
      //       },
      //     ],
      //   };
      // }
    }
    // FIX THIS LATER
    // req.session.userId = user._id;
    return { user };
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
