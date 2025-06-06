import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum NarrativeStage {
  EMERGING = 'emerging',
  GROWING = 'growing',
  PEAK = 'peak',
  DECLINING = 'declining',
}

@Schema({ timestamps: true })
export class Narrative extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop([String])
  keywords: string[];

  @Prop({ type: String, enum: NarrativeStage, default: NarrativeStage.EMERGING })
  stage: NarrativeStage;

  @Prop()
  momentumScore: number;

  @Prop()
  firstDetected: Date;

  @Prop()
  lastUpdated: Date;

  @Prop({ type: Map, of: Number })
  relatedAssets: Map<string, number>; // asset -> correlation score
}

export const NarrativeSchema = SchemaFactory.createForClass(Narrative);