import { NextFunction, Request, Response, Router } from 'express';
import { Inject } from 'injection-js';
import { IExpressController } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { Category } from '../../../models/category/category';
import { BaseProcessor } from '../../../processors/base-processor';
import { CategoryProcessor } from '../../../processors/category-processor';
import { IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm, IAdminAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { Logger } from '../../../services/logging/logging';
import { ParentRouter, ResponseBody } from '../../router-types';

export class AdminCategoryController extends ParentRouter implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('CategoryProcessor') private readonly categoryProcessor: BaseProcessor<Category>,
    @Inject('ILocationDataMapper') private readonly categoryAcl: IAclPerm,
    @Inject('IAdminDataMapper') private readonly adminAcl: IAdminAclPerm,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    super();
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    app.get(
      '/',
      this.authService.verifyAcl(this.categoryAcl, AclOperations.READ_ALL),
      (req, res, next) => this.getAllCategoriesHandler(res, next),
    );

    app.post(
      '/',
      this.authService.verifyAcl(this.categoryAcl, AclOperations.CREATE),
      (req, res, next) => this.createCategoryHandler(req, res, next),
    );

    app.put(
      '/',
      this.authService.verifyAcl(this.categoryAcl, AclOperations.CREATE),
      (req, res, next) => this.updateCategoryHandler(req, res, next),
    );

    app.delete(
      '/',
      this.authService.verifyAcl(this.categoryAcl, AclOperations.DELETE),
      (req, res, next) => this.deleteCategoryHandler(req, res, next),
    );
  }

  /**
   * @api {get} /admin/category Get the list of existing categories
   * @apiVersion 2.0.0
   * @apiName Get Category List
   * @apiGroup Admin Category
   * @apiPermission DirectorPermission
   *
   * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
   * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
   *
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Location[]} Array of Categories
   * @apiUse ResponseBodyDescription
   */
  private async getAllCategoriesHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.categoryProcessor.getAllData({
        count: res.locals.limit,
        startAt: res.locals.offset,
        ignoreCache: res.locals.ignoreCache,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /admin/category Create a new Category
   * @apiVersion 2.0.0
   * @apiName Create Category
   * @apiGroup Admin Category
   * @apiPermission DirectorPermission
   *
   * @apiParam {String} categoryName - the name of the new category that is to be inserted into the database
   * @apiParam {bolean} isSponsor - Whether the category is a spoonsor category
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Category} The inserted category
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async createCategoryHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.categoryName) {
      return Util.standardErrorHandler(new HttpError('Cannot find category name', 400), next);
    }
    if (!req.body.isSponsor) {
      req.body.isSponsor = false;
    }
    try {
      const result = await this.categoryProcessor.addData(req.body);
      const response = new ResponseBody(
        'Success',
        200,
        result,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {put} /admin/category Update category
   * @apiVersion 2.0.0
   * @apiName Update Location
   * @apiGroup Admin Location
   * @apiPermission DirectorPermission
   *
   * @apiParam {String} uid - the uid of category to update
   * @apiParam {String} [categoryName] - new category name
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Category} The updated category
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async updateCategoryHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find ID of location', 400), next);
    }
    try {
      const result = await this.categoryProcessor.updateData(req.body);
      const response = new ResponseBody(
        'Success',
        200,
        result,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {delete} /admin/category Remove a category
   * @apiVersion 2.0.0
   * @apiName Remove Category
   * @apiGroup Admin Category
   * @apiPermission DirectorPermission
   *
   * @apiParam {String} uid - the uid of the category that is being selected for removal
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async deleteCategoryHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find ID of location', 400), next);
    }
    try {
      const result = await this.categoryProcessor.deleteData(req.body);
      const response = new ResponseBody(
        'Success',
        200,
        result,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

}
