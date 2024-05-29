import { createLogger } from '../utils/logger.mjs'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import {
  PutObjectCommand,
  GetObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import AWSXRay from 'aws-xray-sdk-core'

const dynamoDbClient = DynamoDBDocument.from(
  AWSXRay.captureAWSv3Client(new DynamoDB())
)

const logger = createLogger('todosAccess')

const todosTable = process.env.TODOS_TABLE
const todosIndex = process.env.TODOS_CREATED_AT_INDEX
const url_expiration = parseInt(process.env.SIGNED_URL_EXPIRATION)
const s3_bucket_name = process.env.ATTACHMENT_S3_BUCKET

export async function getAll(userId) {
  logger.info(`${userId} call function getall`)
  const result = await dynamoDbClient.query({
    TableName: todosTable,
    IndexName: todosIndex,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  })

  logger.info(`${userId} call successfully `)
  const items = result.Items
  return items
}

export async function create(item) {
  logger.info('call function create')
  await dynamoDbClient.put({
    TableName: todosTable,
    Item: item
  })
  return item
}

export async function updateToDo(userId, todoId, todoUpdate) {
  logger.info(`Updating todo item ${todoId} in ${todosTable}`)
  try {
    await dynamoDbClient.update({
      TableName: todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: 'set #name = :name, #dueDate = :dueDate, #done = :done',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#dueDate': 'dueDate',
        '#done': 'done'
      },
      ExpressionAttributeValues: {
        ':name': todoUpdate.name,
        ':dueDate': todoUpdate.dueDate,
        ':done': todoUpdate.done
      },
      ReturnValues: 'UPDATED_NEW'
    })
  } catch (error) {
    logger.error('Error =======> updating Todo.', {
      error: error,
      data: {
        todoId,
        userId,
        todoUpdate
      }
    })
    throw Error(error)
  }
  return todoUpdate
}

export async function deleteTodo(userId, todoId) {
  logger.info(`Deleting todo item ${todoId}`)
  try {
    await dynamoDbClient.delete({
      TableName: todosTable,
      Key: {
        userId,
        todoId
      }
    })
    return 'success'
  } catch (e) {
    logger.info('Error ==>>', {
      error: e
    })
    return 'Error'
  }
}

export async function getUploadUrl(userId, todoId) {
  const s3Client2 = new S3Client()
  const command = new PutObjectCommand({
    Bucket: s3_bucket_name,
    Key: todoId
  })
  const uploadUrl = await getSignedUrl(s3Client2, command, {
    expiresIn: url_expiration
  })

  await dynamoDbClient.update({
    TableName: todosTable,
    Key: {
      userId,
      todoId
    },
    UpdateExpression: 'set attachmentUrl = :URL',
    ExpressionAttributeValues: {
      ':URL': uploadUrl.split('?')[0]
    },
    ReturnValues: 'UPDATED_NEW'
  })
  return uploadUrl
}
