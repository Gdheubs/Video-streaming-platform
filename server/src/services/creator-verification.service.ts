/**
 * Creator Verification Service
 * Handles USC 2257 compliance (US law requiring age verification records for adult content creators)
 * CRITICAL: This is legally required for US-based adult content platforms
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const prisma = new PrismaClient();
const s3Client = new S3Client({ region: process.env.AWS_REGION });

interface CreatorVerificationData {
  userId: string;
  fullLegalName: string;
  dateOfBirth: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  idDocumentType: 'passport' | 'drivers_license' | 'national_id';
  idDocumentNumber: string;
  idExpirationDate: string;
}

interface Compliance2257Record {
  legalName: string;
  dateOfBirth: string;
  address: string;
  idType: string;
  idNumber: string; // ENCRYPTED
  idExpiration: string;
  custodianOfRecords: string;
  verifiedAt: string;
  verifiedBy: string;
}

/**
 * Submit creator verification application
 */
export const submitCreatorVerification = async (
  data: CreatorVerificationData,
  idDocumentFile: Buffer
): Promise<void> => {
  // 1. Upload ID document to encrypted S3 bucket
  const encryptedKey = await uploadIdDocument(data.userId, idDocumentFile);

  // 2. Create 2257 compliance record (encrypted)
  const complianceRecord: Compliance2257Record = {
    legalName: data.fullLegalName,
    dateOfBirth: data.dateOfBirth,
    address: `${data.addressLine1}, ${data.city}, ${data.state} ${data.zipCode}, ${data.country}`,
    idType: data.idDocumentType,
    idNumber: encryptData(data.idDocumentNumber), // MUST be encrypted
    idExpiration: data.idExpirationDate,
    custodianOfRecords: process.env.CUSTODIAN_OF_RECORDS_NAME || 'Legal Department',
    verifiedAt: new Date().toISOString(),
    verifiedBy: 'PENDING_ADMIN_REVIEW',
  };

  // 3. Create or update creator profile
  await prisma.creator.upsert({
    where: { userId: data.userId },
    create: {
      userId: data.userId,
      verificationStatus: 'PENDING',
      idDocumentUrl: encryptedKey,
      compliance2257Records: complianceRecord as any,
    },
    update: {
      verificationStatus: 'PENDING',
      idDocumentUrl: encryptedKey,
      compliance2257Records: complianceRecord as any,
    },
  });

  // 4. Audit log
  await prisma.auditLog.create({
    data: {
      action: 'CREATOR_VERIFICATION_SUBMITTED',
      entityType: 'Creator',
      entityId: data.userId,
      performedBy: data.userId,
      metadata: { status: 'PENDING' },
    },
  });
};

/**
 * Upload ID document to encrypted S3 bucket
 */
const uploadIdDocument = async (userId: string, fileBuffer: Buffer): Promise<string> => {
  const key = `compliance/2257/${userId}/${crypto.randomUUID()}.encrypted`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_COMPLIANCE_BUCKET,
    Key: key,
    Body: fileBuffer,
    ServerSideEncryption: 'AES256', // REQUIRED: Server-side encryption
    Metadata: {
      'user-id': userId,
      'document-type': 'id-verification',
      'uploaded-at': new Date().toISOString(),
    },
    ACL: 'private', // NEVER make these public
  });

  await s3Client.send(command);
  return key;
};

/**
 * Approve creator verification (Admin action)
 */
export const approveCreatorVerification = async (
  userId: string,
  adminId: string
): Promise<void> => {
  const creator = await prisma.creator.findUnique({ where: { userId } });
  if (!creator) throw new Error('Creator profile not found');

  // Update 2257 record with admin approval
  const updatedRecord = {
    ...(creator.compliance2257Records as any),
    verifiedBy: adminId,
    approvedAt: new Date().toISOString(),
  };

  await prisma.creator.update({
    where: { userId },
    data: {
      verificationStatus: 'APPROVED',
      verifiedAt: new Date(),
      compliance2257Records: updatedRecord,
    },
  });

  // Update user role to CREATOR
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'CREATOR' },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'CREATOR_VERIFICATION_APPROVED',
      entityType: 'Creator',
      entityId: userId,
      performedBy: adminId,
    },
  });
};

/**
 * Reject creator verification (Admin action)
 */
export const rejectCreatorVerification = async (
  userId: string,
  adminId: string,
  reason: string
): Promise<void> => {
  await prisma.creator.update({
    where: { userId },
    data: {
      verificationStatus: 'REJECTED',
      rejectionReason: reason,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'CREATOR_VERIFICATION_REJECTED',
      entityType: 'Creator',
      entityId: userId,
      performedBy: adminId,
      metadata: { reason },
    },
  });
};

/**
 * Get 2257 compliance record (Admin only, decrypted)
 */
export const getComplianceRecord = async (
  userId: string,
  adminId: string
): Promise<Compliance2257Record> => {
  const creator = await prisma.creator.findUnique({
    where: { userId },
    select: { compliance2257Records: true },
  });

  if (!creator?.compliance2257Records) {
    throw new Error('No compliance record found');
  }

  // Audit access to compliance records
  await prisma.auditLog.create({
    data: {
      action: 'COMPLIANCE_RECORD_ACCESSED',
      entityType: 'Creator',
      entityId: userId,
      performedBy: adminId,
    },
  });

  const record = creator.compliance2257Records as any;
  
  // Decrypt sensitive fields
  return {
    ...record,
    idNumber: decryptData(record.idNumber),
  };
};

/**
 * Encrypt sensitive data (AES-256)
 */
const encryptData = (data: string): string => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt sensitive data
 */
const decryptData = (encryptedData: string): string => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
  
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
