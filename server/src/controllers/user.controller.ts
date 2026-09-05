import { Request, Response } from 'express';
import { User } from '../models/User';

export class UserController {
  /**
   * POST /api/user/onboarding
   * Saves the personalized onboarding responses and marks completedOnboarding = true.
   */
  public async submitOnboarding(req: Request, res: Response): Promise<void> {
    try {
      // The authenticate middleware should attach user to req.user
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        qualification,
        status,
        year,
        specialization,
        careerGoal,
        industryInterest,
        technologies,
        skillsToImprove,
        technicalLevel,
      } = req.body;

      // Ensure user exists
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Update fields
      user.completedOnboarding = true;
      user.qualification = qualification || user.qualification;
      user.status = status || user.status;
      user.year = year || user.year;
      user.specialization = specialization || user.specialization;
      user.careerGoal = careerGoal || user.careerGoal;
      user.industryInterest = industryInterest || user.industryInterest;
      user.technologies = technologies || user.technologies;
      user.skillsToImprove = skillsToImprove || user.skillsToImprove;
      user.technicalLevel = technicalLevel || user.technicalLevel;

      await user.save();

      console.log(`[ONBOARDING] ✅ Completed for user ${user.email}`);

      res.status(200).json({
        message: 'Onboarding saved successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          completedOnboarding: user.completedOnboarding,
        },
      });
    } catch (error) {
      console.error('[ONBOARDING] Error:', error);
      res.status(500).json({ error: 'Internal server error while saving onboarding data' });
    }
  }
}

export const userController = new UserController();
