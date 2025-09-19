// MongoDB integration for RLS Guard Dog
// Created: September 19, 2025
// Description: MongoDB client and operations for class averages storage

import { MongoClient, Db, Collection } from 'mongodb';
import type { ClassAverage } from '@/types/database';

// MongoDB connection
let client: MongoClient | null = null;
let db: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'rls_guard_dog';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

export async function connectToMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(MONGODB_DB_NAME);
    
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectFromMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('Disconnected from MongoDB');
  }
}

// Get class averages collection
export async function getClassAveragesCollection(): Promise<Collection<ClassAverage>> {
  const database = await connectToMongoDB();
  return database.collection<ClassAverage>('class_averages');
}

// Class averages operations
export async function saveClassAverages(averages: Omit<ClassAverage, '_id'>[]): Promise<void> {
  try {
    const collection = await getClassAveragesCollection();
    
    // Use upsert to avoid duplicates based on school_id, class_name, subject, month, year
    const operations = averages.map(average => ({
      updateOne: {
        filter: {
          school_id: average.school_id,
          class_name: average.class_name,
          subject: average.subject,
          month: average.month,
          year: average.year
        },
        update: {
          $set: {
            ...average,
            calculated_at: new Date()
          }
        },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await collection.bulkWrite(operations);
      console.log(`Saved ${operations.length} class averages to MongoDB`);
    }
  } catch (error) {
    console.error('Error saving class averages:', error);
    throw error;
  }
}

export async function getClassAverages(
  schoolId: string,
  filters?: {
    class_name?: string;
    subject?: string;
    month?: number;
    year?: number;
    limit?: number;
  }
): Promise<ClassAverage[]> {
  try {
    const collection = await getClassAveragesCollection();
    
    const query: Record<string, unknown> = { school_id: schoolId };
    
    if (filters?.class_name) {
      query.class_name = filters.class_name;
    }
    
    if (filters?.subject) {
      query.subject = filters.subject;
    }
    
    if (filters?.month) {
      query.month = filters.month;
    }
    
    if (filters?.year) {
      query.year = filters.year;
    }

    const cursor = collection
      .find(query)
      .sort({ calculated_at: -1 });
    
    if (filters?.limit) {
      cursor.limit(filters.limit);
    }

    return await cursor.toArray();
  } catch (error) {
    console.error('Error fetching class averages:', error);
    throw error;
  }
}

export async function getClassAveragesTrends(
  schoolId: string,
  className: string,
  subject: string,
  months: number = 6
): Promise<ClassAverage[]> {
  try {
    const collection = await getClassAveragesCollection();
    
    const currentDate = new Date();
    const pastDate = new Date();
    pastDate.setMonth(currentDate.getMonth() - months);

    const pipeline = [
      {
        $match: {
          school_id: schoolId,
          class_name: className,
          subject: subject,
          calculated_at: { $gte: pastDate }
        }
      },
      {
        $sort: { year: 1, month: 1 }
      }
    ];

    return await collection.aggregate<ClassAverage>(pipeline).toArray();
  } catch (error) {
    console.error('Error fetching class average trends:', error);
    throw error;
  }
}

export async function getSchoolAveragesSummary(
  schoolId: string,
  year?: number,
  month?: number
): Promise<Array<{
  subject: string;
  average_score: number;
  total_classes: number;
  total_students: number;
}>> {
  try {
    const collection = await getClassAveragesCollection();
    
    const matchQuery: Record<string, unknown> = { school_id: schoolId };
    
    if (year) matchQuery.year = year;
    if (month) matchQuery.month = month;

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: '$subject',
          average_score: { $avg: '$average_score' },
          total_classes: { $sum: 1 },
          total_students: { $sum: '$total_students' }
        }
      },
      {
        $project: {
          subject: '$_id',
          average_score: { $round: ['$average_score', 2] },
          total_classes: 1,
          total_students: 1,
          _id: 0
        }
      },
      { $sort: { subject: 1 } }
    ];

    return await collection.aggregate<{
      subject: string;
      average_score: number;
      total_classes: number;
      total_students: number;
    }>(pipeline).toArray();
  } catch (error) {
    console.error('Error fetching school averages summary:', error);
    throw error;
  }
}

export async function deleteOldClassAverages(monthsToKeep: number = 12): Promise<number> {
  try {
    const collection = await getClassAveragesCollection();
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);

    const result = await collection.deleteMany({
      calculated_at: { $lt: cutoffDate }
    });

    console.log(`Deleted ${result.deletedCount} old class average records`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting old class averages:', error);
    throw error;
  }
}

// Initialize indexes for better performance
export async function createIndexes(): Promise<void> {
  try {
    const collection = await getClassAveragesCollection();
    
    await collection.createIndexes([
      { key: { school_id: 1, class_name: 1, subject: 1 } },
      { key: { school_id: 1, year: 1, month: 1 } },
      { key: { calculated_at: 1 } },
      { 
        key: { school_id: 1, class_name: 1, subject: 1, year: 1, month: 1 },
        unique: true 
      }
    ]);

    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
    throw error;
  }
}

// Health check function
export async function pingMongoDB(): Promise<boolean> {
  try {
    const database = await connectToMongoDB();
    await database.admin().ping();
    return true;
  } catch (error) {
    console.error('MongoDB ping failed:', error);
    return false;
  }
}