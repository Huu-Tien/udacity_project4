import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'
import { UpdateTodo } from '../../businessLogic/todo.js'
import { getUserId } from '../utils.mjs'

const updateTodoHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const todoId = event.pathParameters.todoId;
    const updatedTodo = JSON.parse(event.body);
    const updatedItem = await UpdateTodo(userId, todoId, updatedTodo);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ item: updatedItem }),
    };
  } catch (error) {
    console.error('Error updating todo:', error);
    throw createError(500, JSON.stringify({ error: error.message || 'Internal Server Error' }));
  }
};

export const handler = middy(updateTodoHandler)
  .use(httpErrorHandler())
  .use(cors({ credentials: true }));