import { injectable, inject } from 'tsyringe'
import path from 'path'

import AppError from '@shared/errors/AppError'
import User from '../infra/typeorm/entities/User'
import IUserRepository from '../repositories/IUsersRepository'
import IUserTokensRepository from '../repositories/IUserTokensRepository'
import IMailProvider from '@shared/container/provider/MailProvider/models/IMailProvider'

interface IRequest {
   email: string
}

@injectable()
class SendForgotPasswordEmailService {
   constructor(
      @inject('UsersRepository')
      private usersRepository: IUserRepository,

      @inject('MailProvider')
      private mailProvider: IMailProvider,

      @inject('UserTokensRepository')
      private userTokensRepository: IUserTokensRepository,
   ) { }

   public async execute({ email }: IRequest): Promise<void> {
      const user = await this.usersRepository.findByEmail(email)

      if (!user) {
         throw new AppError('Usuário não existe.')
      }

      const { token } = await this.userTokensRepository.generate(user.id)
      const forgotPasswordTemplate = path.resolve(
         __dirname,
         '..',
         'views',
         'forgot_password.hbs'
      )

      await this.mailProvider.sendMail({
         to: {
            name: user.name,
            email: user.email,
         },
         subject: '[Sam Security] Recuperação de Senha',
         templateData: {
            file: forgotPasswordTemplate,
            variables: {
               name: user.name,
               link: `${process.env.APP_WEB_URL}/reset-password?token=${token}`,
            }
         }
      })
   }
}

export default SendForgotPasswordEmailService