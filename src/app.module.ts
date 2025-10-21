import { RemoteGraphQLDataSource } from '@apollo/gateway';
import {
  HttpException,
  HttpStatus,
  MiddlewareConsumer,
  Module,
  UnauthorizedException,
} from '@nestjs/common';
import { IntrospectAndCompose } from '@apollo/gateway';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule } from '@nestjs/config';
import { INVALID_AUTH_TOKEN, UNAUTHORIZED_USER } from './constants';
import { verify } from 'jsonwebtoken';
import { request, gql, GraphQLClient } from 'graphql-request';

const {
  graphqlUploadExpress, // A Koa implementation is also exported.
} = require('graphql-upload');
import { ApolloError } from 'apollo-server-express';

const decodeToken = (tokenString: string) => {
  const decoded = verify(tokenString, process.env.JWT_SECRET || 'dimitraaccesstokensecret');
  if (!decoded) {
    throw new HttpException(
      { message: INVALID_AUTH_TOKEN },
      HttpStatus.UNAUTHORIZED,
    );
  }
  return decoded;
};

const decodeLgCommToken = (tokenString: string) => {
  const decoded = verify(tokenString, 'santoshgusainaccesstokensecret');
  if (!decoded) {
    throw new HttpException(
      { message: INVALID_AUTH_TOKEN },
      HttpStatus.UNAUTHORIZED,
    );
  }
  return decoded;
};

const handleAuth = async ({ req }) => {
  try {
    // console.log(req.headers, 'Gateway req headers');
    if (req.headers.app !== 'lgcomm') {
      if (req.headers.authorization) {
        const token = req.headers.authorization;
        const decoded: any = decodeToken(token);
        console.log(decoded, 'tokenDecoded');
        if (!decoded.data) {
          throw new UnauthorizedException(UNAUTHORIZED_USER);
        }
        const graphQLClient = new GraphQLClient(
          process.env.FARMER_SYNC_URL + '/graphql',
          {
            headers: {
              userid: decoded.data.userId,
              lang:req.headers?.lang ?? 'en'
            },
          },
        );
        const currentUserQuery = gql`
          {
            currentUser {
              userDetail {
                id
                email
                role
                verified
                countryCode
                mobile
                firstName
                lastName
              }
              getUserCurrentMembershipPlan {
                id
                membership_id
                start_date
                end_date
                active
                payment_id

                membershipData {
                  satellite_report
                  membership_name
                  no_of_animals
                  description
                  pasture_report
                  other_report
                  plan_duration
                  other_config
                  organization
                  membershipFeesData {
                    per_month_fee
                    is_free_trial
                    default_status
                    in_use
                  }
                }
              }
            }
          }
        `;
        // const query = gql`
        //   {
        //     getUserCurrentMembershipPlan {
        //       id
        //       membership_id
        //       start_date
        //       end_date
        //       active
        //       payment_id

        //       membershipData {
        //         satellite_report
        //         membership_name
        //         no_of_animals
        //         description
        //         pasture_report
        //         other_report
        //         plan_duration
        //         other_config
        //         organization
        //         membershipFeesData {
        //           per_month_fee
        //           is_free_trial
        //           default_status
        //           in_use
        //         }
        //       }
        //     }
        //   }
        // `;
        const currentUser = await graphQLClient.request(currentUserQuery);
        // const memberships = await graphQLClient.request(query);

        console.log(currentUser, 'currentUserData');
        return {
          userId: decoded.data.userId,
          lang: `${req.headers.lang}`,
          permissions: decoded.permissions,
          authorization: `${req.headers.authorization}`,
          memberships: currentUser?.currentUser?.getUserCurrentMembershipPlan,
          currentUser: currentUser?.currentUser?.userDetail,
        };
      } else {
        throw new UnauthorizedException(INVALID_AUTH_TOKEN);
      }
    } else if (req.headers.app === 'lgcomm') {
      console.log('lgcomm app detected');
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization;
          // console.log(token, 'Token')
          const decoded: any = decodeLgCommToken(token);
          // console.log(decoded, 'decoded')
          if (decoded.data.app !== 'lgcomm') {
            throw new UnauthorizedException(UNAUTHORIZED_USER);
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  } catch (err) {
    throw new UnauthorizedException(UNAUTHORIZED_USER);
  }
};
@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      server: {
        context: handleAuth,
        cors: true,
        formatError: (error: any) => {
          const errorObj = {
            success: false,
            statusCode: 500,
            serviceName: 'gateway',
            message: 'Something went wrong',
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              path: [],
              response: {
                message: 'Something went wrong',
                detail: 'Internal Server Error',
              },
            },
          };

          if (error instanceof ApolloError) {
            errorObj.message = error?.message;
            errorObj.statusCode =
              error?.extensions?.response?.statusCode || 500;
            errorObj.extensions = {
              code: error.extensions?.code || errorObj.extensions.code,
              path: errorObj.extensions.path,
              response: {
                message:
                  error.extensions.response?.message ||
                  errorObj.extensions.response.message,
                detail:
                  error.extensions.response?.error ||
                  errorObj.extensions.response.message,
              },
            };
          } else if (error?.extensions?.exception?.name == 'HttpException') {
            errorObj.message = error?.message;
            errorObj.statusCode =
              error.extensions.exception?.status || errorObj.statusCode;
            errorObj.extensions = {
              code: error.extensions?.code || errorObj.extensions.code,
              path: error?.path || errorObj.extensions.path,
              response: {
                message:
                  error.extensions.exception?.message ||
                  errorObj.extensions.response.message,
                detail: errorObj.extensions.response.message,
              },
            };
          } else {
            errorObj.message = error?.message || errorObj.message;
            errorObj.statusCode =
              error.extensions?.exception?.statusCode || errorObj.statusCode;
            errorObj.serviceName =
              error?.extensions?.serviceName || errorObj.serviceName;
            errorObj.extensions = {
              code: error.extensions?.code || errorObj.extensions.code,
              path: error?.extensions?.path || errorObj.extensions.path,
              response: {
                message: error?.message || errorObj.extensions.response.message,
                detail:
                  error?.extenstions?.exception?.details ||
                  errorObj.extensions.response.message,
              },
            };
          }

          return errorObj;
        },
      },
      driver: ApolloGatewayDriver,
      gateway: {
        buildService: ({ name, url }) => {

          return new RemoteGraphQLDataSource({
            url,
            willSendRequest({ request, context }: any) {
              request.http.headers.set('userId', context.userId);
              request.http.headers.set('lang', context.lang);
              // for now pass authorization also
              request.http.headers.set('authorization', context.authorization);
              request.http.headers.set('permissions', context.permissions);
              request.http.headers.set(
                'memberships',
                JSON.stringify(context.memberships),
              );

              request.http.headers.set(
                'user',
                JSON.stringify(context.currentUser),
              );
            },
          });
        },
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            // {
            //   name: 'information',
            //   url: process.env.INFORMATION_SERVICE_URL + '/graphql',
            // },
            // {
            //   name: 'registration',
            //   url: process.env.REGISTRATION_SERVICE_URL + '/graphql',
            // },
            // { name: 'goals', url: process.env.GOALS_SERVICE_URL + '/graphql' },
            { name: 'sync', url: process.env.FARMER_SYNC_URL + '/graphql' },
            // { name: 'epd', url: process.env.EPD_SERVICE_URL + '/graphql' },
            // { name: 'feed_mgmt', url: process.env.FEED_MGMT_URL + '/graphql' },
          ],
        }),
      },
    }),
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    //middleware to upload files
    consumer
      .apply(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }))
      .forRoutes('graphql');
  }
}
