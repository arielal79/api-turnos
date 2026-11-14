import { UserModel, IUser } from "./user.model";

export const userRepository = {
  findById(id: string) {
    return UserModel.findById(id);
  },

  findByEmail(email: string, conPassword = false) {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    return conPassword ? query.select("+password") : query;
  },
  create(
    data: Pick<IUser, "nombre" | "email" | "password"> &
      Partial<Pick<IUser, "rol">>,
  ) {
    return UserModel.create(data);
  },
};
