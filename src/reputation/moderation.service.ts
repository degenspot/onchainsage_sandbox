import { getRepository } from 'typeorm';
import { Content } from '../entities/Content';
import { ModerationAction } from '../entities/ModerationAction';
import { User } from '../entities/User';
import { ReputationService } from './reputation.service';
import { FalseFlagRecord } from '../entities/FalseFlagRecord';

export class ModerationService {
  static async performAction(actorId: string, contentId: string, type: 'flag' | 'approve' | 'remove', metadata: any = {}) {
    const userRepo = getRepository(User);
    const contentRepo = getRepository(Content);
    const actionRepo = getRepository(ModerationAction);
    const ffRepo = getRepository(FalseFlagRecord);

    const actor = await userRepo.findOne({ where: { id: actorId } });
    const content = await contentRepo.findOne({ where: { id: contentId } });
    if (!actor || !content) throw new Error('Actor or content not found');

    const weight = await ReputationService.computeWeightForUser(actorId);

    const action = actionRepo.create({ actor, content, type, weight, metadata });
    await actionRepo.save(action);

    // Side effects depending on action type
    if (type === 'flag') {
      content.flagScore = (content.flagScore || 0) + weight;
      // if flagScore passes threshold, mark under_review
      if (content.flagScore >= 3) {
        content.status = 'under_review';
      }
      await contentRepo.save(content);
    }

    if (type === 'approve') {
      // lower flagScore
      content.flagScore = Math.max(0, (content.flagScore || 0) - weight);
      await contentRepo.save(content);
    }

    if (type === 'remove') {
      if (actor.isAdmin || actor.reputation >= 100) {
        content.status = 'removed';
        await contentRepo.save(content);
      } else {
        // non-admin remove becomes a disputed action
        action.disputed = true;
        await actionRepo.save(action);
      }
    }

    // log false-flag tracking: simplistic rule - if content was flagged but later unanimously approved by high-rep users -> mark false flag
    // This logic can be expanded in scheduled jobs

    return action;
  }

  static async resolveDispute(contentId: string, resolverId: string) {
    const actionRepo = getRepository(ModerationAction);
    const contentRepo = getRepository(Content);
    const userRepo = getRepository(User);
    const ffRepo = getRepository(FalseFlagRecord);

    const resolver = await userRepo.findOne({ where: { id: resolverId } });
    if (!resolver) throw new Error('Resolver not found');

    // only admins or high rep can resolve
    if (!resolver.isAdmin && resolver.reputation < 200) throw new Error('Insufficient privileges to resolve disputes');

    // fetch disputed actions on content
    const disputedActions = await actionRepo.find({ where: { content: { id: contentId }, disputed: true }, relations: ['actor'] });

    if (!disputedActions.length) throw new Error('No disputed actions found');

    // simple resolution: sum weights of approve vs flag/remove from high-rep voters
    const approveScore = disputedActions.filter(a => a.type === 'approve').reduce((s, a) => s + a.weight, 0);
    const flagScore = disputedActions.filter(a => a.type === 'flag' || a.type === 'remove').reduce((s, a) => s + a.weight, 0);

    const content = await contentRepo.findOne({ where: { id: contentId } });
    if (!content) throw new Error('Content not found');

    if (approveScore >= flagScore) {
      // keep content
      content.status = 'active';
      await contentRepo.save(content);

      // penalize false-flaggers: simplistic approach
      for (const a of disputedActions.filter(a=>a.type==='flag')) {
        const reporter = await userRepo.findOne({ where: { id: a.actor.id } });
        if (!reporter) continue;
        // increment FalseFlagRecord
        let rec = await ffRepo.findOne({ where: { reporter: { id: reporter.id } } });
        if (!rec) {
          rec = ffRepo.create({ reporter, count: 1 });
        } else {
          rec.count += 1;
        }
        await ffRepo.save(rec);

        // if repeated false flags, reduce reputation
        if (rec.count >= 3) {
          reporter.reputation = Math.max(0, reporter.reputation - 10);
          await userRepo.save(reporter);
        }
      }
    } else {
      // remove content
      content.status = 'removed';
      await contentRepo.save(content);

      // reward resolvers slightly
      resolver.reputation += 5;
      await userRepo.save(resolver);
    }

    // mark disputed false
    for (const a of disputedActions) {
      a.disputed = false;
      await actionRepo.save(a);
    }

    return content;
  }
}
