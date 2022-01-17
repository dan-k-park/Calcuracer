import { getModelForClass, mongoose, prop } from "@typegoose/typegoose";

export class User {
  @prop()
  _id: mongoose.Types.ObjectId;

  @prop({ required: true, unique: true })
  username: string;

  @prop({ required: true, unique: true })
  email: string;

  @prop({ required: true })
  password: string;

  @prop()
  avatar?: string;

  @prop()
  title: string;

  @prop()
  matchesWon: number;

  @prop({ type: () => [Object] })
  fastestTimes: object[];
}

const UserModel = getModelForClass(User);

export default UserModel;
