import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import settingsService from '../services/settings.service';

export class SettingsController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { group } = req.query;
      const settings = await settingsService.getAll(tenantId, group as string);

      const response: ApiResponse = {
        success: true,
        data: settings,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getByGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const settings = await settingsService.getByGroup(tenantId, req.params.group);

      const response: ApiResponse = {
        success: true,
        data: settings,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { group, key } = req.params;
      const value = await settingsService.get(tenantId, group, key);

      const response: ApiResponse = {
        success: true,
        data: { key, value },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async set(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const setting = await settingsService.set(tenantId, req.body);

      const response: ApiResponse = {
        success: true,
        data: setting,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async setMany(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { group, settings } = req.body;
      const result = await settingsService.setMany(tenantId, group, settings);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { group, key } = req.params;
      await settingsService.delete(tenantId, group, key);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async initializeDefaults(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const result = await settingsService.initializeDefaults(tenantId);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();

