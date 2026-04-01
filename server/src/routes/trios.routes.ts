import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { query } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

// GET /api/trios — list all trios with member info
router.get('/', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await query(`
    SELECT t.*,
      a.name as account_name, a.email as account_email,
      d.name as designer_name, d.email as designer_email,
      g.name as gt_name, g.email as gt_email,
      tc.name as tech_name, tc.email as tech_email
    FROM trios t
    LEFT JOIN users a ON t.account_user_id = a.id
    LEFT JOIN users d ON t.designer_user_id = d.id
    LEFT JOIN users g ON t.gt_user_id = g.id
    LEFT JOIN users tc ON t.tech_user_id = tc.id
    ORDER BY t.name
  `);
  res.status(200).json({ data: result.rows });
}));

export default router;
