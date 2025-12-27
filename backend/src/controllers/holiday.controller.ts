import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import holidayService from '../services/holiday.service';

export class HolidayController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { startDate, endDate, isRecurring, search, page, limit } = req.query;

      const result = await holidayService.findAll({
        tenantId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        isRecurring: isRecurring === 'true' ? true : isRecurring === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

      const response: ApiResponse = {
        success: true,
        data: result.holidays,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const holiday = await holidayService.findById(req.params.id, tenantId);

      const response: ApiResponse = {
        success: true,
        data: holiday,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const holiday = await holidayService.create({
        tenantId,
        name: req.body.name,
        date: new Date(req.body.date),
        isRecurring: req.body.isRecurring,
      });

      const response: ApiResponse = {
        success: true,
        data: holiday,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const updateData: any = { ...req.body };
      if (req.body.date) {
        updateData.date = new Date(req.body.date);
      }

      const holiday = await holidayService.update(req.params.id, tenantId, updateData);

      const response: ApiResponse = {
        success: true,
        data: holiday,
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

      await holidayService.delete(req.params.id, tenantId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new HolidayController();

