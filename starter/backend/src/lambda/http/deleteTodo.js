import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'
import { DeleteTodo } from '../../businessLogic/todo.js'
import { getUserId } from '../utils.mjs'

const deleteTodoHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const todoId = event.pathParameters.todoId;
    const result = await DeleteTodo(userId, todoId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ result }),
    };
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw createError(500, JSON.stringify({ error: error.message || 'Internal Server Error' }));
  }
};

export const handler = middy(deleteTodoHandler)
  .use(httpErrorHandler())
  .use(cors({ credentials: true }));