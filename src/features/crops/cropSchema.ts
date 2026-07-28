import { z } from "zod";

/**
 * Validation for the "Add Crop" multi-step wizard.
 * Split per-step so each screen can validate only its own fields,
 * then merged for the final Review & Save step.
 */

export const cropBasicInfoSchema = z.object({
  name: z.string().min(2, "Crop name must be at least 2 characters").max(80),
  variety: z.string().max(80).optional(),
  fieldLocation: z.string().max(120).optional(),
});

export const cropPlantingInfoSchema = z.object({
  plantingDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Enter a valid planting date",
  }),
});

export const cropHarvestInfoSchema = z.object({
  expectedHarvestDate: z
    .string()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: "Enter a valid expected harvest date",
    })
    .optional(),
});

export const cropNotesSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const cropFormSchema = cropBasicInfoSchema
  .merge(cropPlantingInfoSchema)
  .merge(cropHarvestInfoSchema)
  .merge(cropNotesSchema)
  .extend({
    photoUris: z.array(z.string()).default([]),
  });

export type CropFormValues = z.infer<typeof cropFormSchema>;
