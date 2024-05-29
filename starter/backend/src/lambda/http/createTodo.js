import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'
import { createTodo } from '../../businessLogic/todo.js'
import { getUserId } from '../utils.mjs'

const createTodoHandler = async (event) => {
  try {
    const newTodo = JSON.parse(event.body);
    const userId = getUserId(event);
    const todo = await createTodo(newTodo, userId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ item: todo }),
    };
  } catch (error) {
    console.error('Error creating todo:', error);
    throw createError(500, JSON.stringify({ error: error.message || 'Internal Server Error' }));
  }
};

export const handler = middy(createTodoHandler)
  .use(httpErrorHandler())
  .use(cors({ credentials: true }));