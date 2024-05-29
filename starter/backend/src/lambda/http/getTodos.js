import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'
import { getTodosForUser } from '../../businessLogic/todo.js'
import { getUserId } from '../utils.mjs'

const baseHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const todos = await getTodosForUser(userId);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ items: todos }),
    };
  } catch (error) {
    throw createError(500, JSON.stringify({ error }));
  }
};

export const handler = middy(baseHandler)
  .use(httpErrorHandler())
  .use(cors({ credentials: true }));