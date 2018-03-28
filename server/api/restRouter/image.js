import express from 'express'
import aws from 'aws-sdk'
import multer from 'multer'
import multerS3 from 'multer-s3'
import path from 'path'
import uuid from 'uuid/v4'

const s3 = new aws.S3({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

const s3Storage = multerS3({
  s3: s3,
  bucket: 'endeavorfleet-images',
  key: async (req, uploadedFile, cb) => {
    const key = `${uuid()}${path.extname(uploadedFile.originalname)}`
    cb(null, key)
  },
})

const upload = multer({
  storage: s3Storage,
})

const router = express.Router()

router.post('/', upload.single('file'), (req, res) => {
  console.log('uploaded image', req.file)
  res.json({ uri: req.file.uri })
})

export default router
