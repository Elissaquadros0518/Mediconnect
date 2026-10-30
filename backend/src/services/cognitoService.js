import { GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognito } from '../config/aws.js';

export async function verifyAccessToken(accessToken) {
  if (!accessToken) throw new Error('Access token is required.');
  const result = await cognito.send(new GetUserCommand({ AccessToken: accessToken }));
  const attributes = Object.fromEntries((result.UserAttributes ?? []).map(({ Name, Value }) => [Name, Value]));
  if (!result.Username) throw new Error('Cognito did not return a user identity.');
  return { subject: result.Username, attributes };
}
