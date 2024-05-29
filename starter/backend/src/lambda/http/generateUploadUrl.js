import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'
import { createAttachmentPresignedUrl } from '../../businessLogic/todo.js'
import { getUserId } from '../utils.mjs'

const createPresignedUrlHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const todoId = event.pathParameters.todoId;
    const uploadUrl = await createAttachmentPresignedUrl(userId, todoId);

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ uploadUrl }),
    };
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    throw createError(500, JSON.stringify({ error: error.message || 'Internal Server Error' }));
  }
};

export const handler = middy(createPresignedUrlHandler)
  .use(httpErrorHandler())
  .use(cors({ credentials: true }));