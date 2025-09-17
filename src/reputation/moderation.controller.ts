import { Request, Response, Router } from 'express';
import { ModerationService } from '../services/moderation.service';
import { AppealService } from '../services/appeal.service';

const router = Router();

router.post('/action', async (req: Request, res: Response) => {
  // expects { actorId, contentId, type }
  try {
    const { actorId, contentId, type, metadata } = req.body;
    const action = await ModerationService.performAction(actorId, contentId, type, metadata);
    res.json({ success: true, action });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/resolve', async (req: Request, res: Response) => {
  // { resolverId, contentId }
  try {
    const { resolverId, contentId } = req.body;
    const content = await ModerationService.resolveDispute(contentId, resolverId);
    res.json({ success: true, content });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/appeal', async (req: Request, res: Response) => {
  try {
    const { requesterId, contentId, reason } = req.body;
    const appeal = await AppealService.createAppeal(requesterId, contentId, reason);
    res.json({ success: true, appeal });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/appeal/resolve', async (req: Request, res: Response) => {
  try {
    const { appealId, resolverId, accept } = req.body;
    const appeal = await AppealService.resolveAppeal(appealId, resolverId, accept);
    res.json({ success: true, appeal });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;