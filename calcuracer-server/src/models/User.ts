import { getModelForClass, prop as Property } from "@typegoose/typegoose";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class User {
  @Field()
  _id!: string;

  @Field()
  @Property({ required: true, unique: true })
  username!: string;

  @Property({ required: true, unique: true })
  email: string;

  @Field()
  @Property({ required: true })
  password!: string;

  @Field()
  @Property()
  avatar?: string;

  @Property()
  title: string;

  @Property()
  matchesWon: number;

  @Property({ type: () => [Number] })
  fastestTimes: number[];
}

const UserModel = getModelForClass(User);

export default UserModel;
