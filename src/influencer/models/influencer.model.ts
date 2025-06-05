import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Influencer extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  platform: string; // 'twitter', 'youtube', etc.

  @Prop()
  followers: number;

  @Prop()
  engagementRate: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const InfluencerSchema = SchemaFactory.createForClass(Influencer);