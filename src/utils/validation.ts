import { z } from 'zod';

export const cropFormSchema = z.object({
  name: z.string().min(1, 'Crop name is required').max(100, 'Name too long'),
  variety: z.string().max(100, 'Variety too long').optional().or(z.literal('')),
  fieldLocation: z.string().max(200, 'Location too long').optional().or(z.literal('')),
  plantingDate: z.string().min(1, 'Planting date is required'),
  expectedHarvestDate: z.string().min(1, 'Expected harvest date is required'),
  actualHarvestDate: z.string().optional().or(z.literal('')),
  status: z.enum(['growing', 'ready_for_harvest', 'harvested', 'failed']).default('growing'),
  notes: z.string().max(1000, 'Notes too long').optional().or(z.literal('')),
  photos: z.array(z.string()).optional(),
  yieldEstimate: z.number().min(0).optional().default(0),
  yieldUnit: z.string().optional().default('kg'),
});

export const expenseFormSchema = z.object({
  cropId: z.string().optional().or(z.literal('')),
  category: z.enum(['seed', 'fertilizer', 'pesticide', 'equipment', 'labor', 'irrigation', 'fuel', 'maintenance', 'transport', 'utility', 'insurance', 'rent', 'other']).default('other'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().default('PHP'),
  date: z.string().min(1, 'Date is required'),
  vendor: z.string().max(200).optional().or(z.literal('')),
  receiptPhoto: z.string().optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  recurring: z.boolean().default(false),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().or(z.literal('')),
});

export const harvestFormSchema = z.object({
  cropId: z.string().min(1, 'Crop is required'),
  harvestDate: z.string().min(1, 'Harvest date is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().default('kg'),
  quality: z.string().optional().or(z.literal('')),
  moistureContent: z.number().min(0).max(100).optional(),
  photos: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional().or(z.literal('')),
  sellingPrice: z.number().min(0).optional().default(0),
  buyer: z.string().max(200).optional().or(z.literal('')),
  revenue: z.number().min(0).optional().default(0),
});

export const fertilizerFormSchema = z.object({
  cropId: z.string().min(1, 'Crop is required'),
  fertilizerName: z.string().min(1, 'Fertilizer name is required').max(100),
  fertilizerType: z.enum(['nitrogen', 'phosphate', 'potash', 'compound', 'organic', 'foliar', 'other']).default('compound'),
  applicationMethod: z.enum(['broadcast', 'banding', 'side_dressing', 'fertigation', 'foliar_spray', 'injection']).default('broadcast'),
  amountPerUnit: z.number().min(0).optional().default(0),
  totalAmount: z.number().min(0, 'Amount must be positive'),
  unit: z.string().default('kg'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  completedDate: z.string().optional().or(z.literal('')),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']).default('pending'),
  notes: z.string().max(1000).optional().or(z.literal('')),
  reminderEnabled: z.boolean().default(true),
});

export type CropFormValues = z.infer<typeof cropFormSchema>;
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
export type HarvestFormValues = z.infer<typeof harvestFormSchema>;
export type FertilizerFormValues = z.infer<typeof fertilizerFormSchema>;
