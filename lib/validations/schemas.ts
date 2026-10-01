import { z } from 'zod';

export const AlertSchema = z.object({
  title: z.string().min(3, 'Title too short').max(100),
  message: z.string().min(5, 'Message too short').max(500),
  level: z.enum(['info', 'advisory', 'urgent']),
  target_group: z.enum(['general', 'choir', 'media', 'ushers', 'youth']),
});

export const SermonSchema = z.object({
  title: z.string().min(3),
  preacher: z.string().min(2),
  date: z.string().date(),
  audio_url: z.string().url().optional().or(z.literal('')),
  video_link: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  topic_id: z.string().uuid().optional().nullable(),
});

export const ProgramSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().max(1000).optional(),
  event_date: z.string().datetime(),
  venue: z.string().min(2).max(100),
  flyer_url: z.string().url().optional().or(z.literal('')),
});

export const GallerySchema = z.object({
  title: z.string().max(100).optional(),
  image_url: z.string().url(),
  event_tag: z.string().max(50).optional(),
});

export const MusicSchema = z.object({
  title: z.string().min(3).max(150),
  artist_choir: z.string().max(100).default('Church Choir'),
  audio_url: z.string().url(),
  lyrics: z.string().max(5000).optional(),
  release_date: z.string().date().optional(),
});

export const DirectorySchema = z.object({
  category: z.enum(['pastor_desk', 'bank_account', 'contact']),
  title: z.string().min(2).max(100),
  detail_value: z.string().min(1).max(500),
  extra_meta: z.string().optional(),
  display_order: z.number().int().default(0),
});

export const BankDirectorySchema = z.object({
  bank: z.string().min(2),
  name: z.string().min(3),
  number: z.string().regex(/^\d{10}$/, 'Must be a valid 10-digit Nigerian account number'),
  code: z.string().optional(),
});

export const ProfileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format').optional(),
  church_group: z.enum(['general', 'choir', 'media', 'ushers', 'youth']).optional(),
  lite_mode: z.boolean().optional(),
});

export const FirstTimerSchema = z.object({
  full_name: z.string().min(2, 'Name required').max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Valid phone/WhatsApp number required'),
  is_first_time: z.boolean().default(true),
  prayer_request: z.string().max(1000).optional(),
  interested_unit: z.enum(['general', 'choir', 'media', 'ushers', 'youth']).default('general'),
});

export const RosterShiftSchema = z.object({
  service_date: z.string().date(),
  unit: z.enum(['choir', 'media', 'ushers', 'youth', 'general']),
  swap_reason: z.string().max(500).optional(),
});

export const ShiftSwapRequestSchema = z.object({
  shift_id: z.string().uuid(),
  action: z.enum(['request_swap', 'cover_shift', 'cancel_swap']),
  swap_reason: z.string().max(500).optional(),
});

export const MilestoneSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().max(2000).optional(),
  category: z.string().min(2).max(50),
  target_amount: z.number().nonnegative().default(0),
  current_amount: z.number().nonnegative().default(0),
  target_date: z.string().date().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'paused']).default('planned'),
  display_order: z.number().int().default(0),
});

export const MilestoneUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(2).max(50).optional(),
  target_amount: z.number().nonnegative().optional(),
  current_amount: z.number().nonnegative().optional(),
  target_date: z.string().date().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'paused']).optional(),
  display_order: z.number().int().optional(),
});