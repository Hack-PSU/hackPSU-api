import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import * as squel from 'squel';
import { UidType } from '../../JSCommon/common-types';
import { HttpError } from '../../JSCommon/errors';
import { ProjectCategoryProcessor } from '../../processors/project/project-category-processor';
import { ProjectTeamProcessor } from '../../processors/project/project-team-processor';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbReadable, IDbResult, IDbWritable } from '../../services/database';
import { selectLock } from '../../services/database/squel-extension/select-with-lock-query';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { IProjectDataMapper, IProjectUowOpts } from './index';
import { Project } from './project';

@Injectable()
export class ProjectDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IProjectDataMapper {

  public COUNT: string = 'project:count';
  public CREATE: string = 'project:create';
  public DELETE: string = 'project:delete';
  public READ: string = 'project:read';
  public READ_ALL: string = 'project:readall';
  public UPDATE: string = 'project:update';

  public tableName: string = 'PROJECT_LIST';
  public teamTableName: string = 'PROJECT_TEAM';
  public tableAssignmentTableName: string = 'TABLE_ASSIGNMENT';

  public dbReader: IDbReadable<Project>;
  public dbWriter: IDbWritable<Project>;
  protected pkColumnName: string = 'projectID';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('ProjectCategoryProcesssor') protected readonly projectCategoryProcessor: ProjectCategoryProcessor,
    @Inject('ProjectTeamProcesssor') protected readonly projectTeamProcessor: ProjectTeamProcessor,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.DELETE],
      [AuthLevel.TECHNOLOGY],
      undefined,
      [AuthLevel[AuthLevel.DIRECTOR]],
    );
    super.addRBAC(
      [this.COUNT],
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
    super.addRBAC(
      [this.READ_ALL],
      [AuthLevel.VOLUNTEER],
      undefined,
      [AuthLevel[AuthLevel.PARTICIPANT]],
    );
    super.addRBAC(
      [this.CREATE, this.READ, this.UPDATE],
      [AuthLevel.PARTICIPANT],
    );
  }

  public delete(projectID: UidType): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, projectID)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, this.dbReader, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public async get(projectID: UidType, opts?: IProjectUowOpts): Promise<IDbResult<Project>> {
    let queryBuilder = await this.readProjectQuery(opts);
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName} = ?`, projectID);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Project>(
      query.text,
      query.values,
      this.dbReader,
      { cache: true },
    ))
      .pipe(
        map((event: Project[]) => ({ result: 'Success', data: event[0] })),
      )
      .toPromise();
  }

  public async getAll(opts?: IProjectUowOpts): Promise<IDbResult<Project[]>> {
    let queryBuilder = await this.readProjectQuery(opts);
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Project>(query.text, query.values, this.dbReader, { cache: true },
      ))
      .pipe(map((projects: Project[]) => ({ result: 'Success', data: projects })),
      )
      .toPromise();
  }

  public async getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'project_count');
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'hackathon = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }
    const query = queryBuilder
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, undefined, { cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  /**
   * Pre condition: {@link project.team} has been validated. Each UID in the team must be valid
   * and cannot already be on a team.
   * {@link project.categories} should be valid categories
   */
  public async insert(project: Project): Promise<IDbResult<Project>> {
    const validation = project.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(project.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .into(this.tableName)
      .setFieldsRows([this.dbWriter.generateDbRepresentation(project)])
      .toParam();
    return from(
      this.sql.query<UidType>(query.text, query.values, undefined, { cache: false }),
    ).pipe(
      switchMap(async () => {
        await Promise.all(project.getTeam()
          .map(userId => this.projectTeamProcessor.addData({
            userId,
            projectId: project.getUid(),
          })));
        await Promise.all(project.getCategories()
          .map(categoryId => this.projectCategoryProcessor.addData({
            categoryId,
            projectId: project.getUid(),
          })));
        return project;
      }),
      map((result: Project) => {
        return { result: 'Success', data: project };
      }),
    ).toPromise();
  }

  public update(object: Project): Promise<IDbResult<Project>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    let queryBuilder = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .where(`${this.pkColumnName} = ?`, object.uid);
    if (object.getTeam()) {
      queryBuilder = queryBuilder.set('team', object.getTeam().join(','));
    }
    if (object.getCategories()) {
      queryBuilder = queryBuilder.set('categories', object.getCategories().join(','));
    }
    if (object.getProjectName()) {
      queryBuilder = queryBuilder.set('project_name', object.getProjectName());
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, this.dbReader, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }

  public async assignTable(project: Project): Promise<IDbResult<Project>> {
    const categories = project.getCategories();
    const hackathonId = await this.activeHackathonDataMapper.activeHackathon.pipe(map(
      hackathon => hackathon.uid)).toPromise();
    const tableSupportPkColumnName = 'tableID';
    const insertQuery = selectLock({ autoQuoteFieldNames: false, autoQuoteTableNames: false })
      .field(tableSupportPkColumnName)
      .from(squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
        .fields(['tableID', 'categoryID', 'priority'])
        .from('TABLE_SUPPORT')
        .where(
          'tableID NOT IN ?',
          squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .from(this.tableAssignmentTableName)
            .field('tableNumber'),
        )
        .order('priority', false))
      .where('categoryID IN ?', categories)
      .group(tableSupportPkColumnName)
      .having('COUNT (DISTINCT categoryID) >= ?', categories.length)
      .forUpdate()
      .limit(1);
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableAssignmentTableName)
      .setFields({
        tableNumber: insertQuery,
        projectID: 'project.getUid()',
        hackathon: hackathonId,
      })
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, undefined, { cache: false })
    ).pipe(
      switchMap(() => this.get(project.getUid())),
    ).toPromise();
  }

  private async readProjectQuery(opts?: IProjectUowOpts) {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(
        squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
          .from(this.tableName, 'project')
          .field('project.projectID')
          .field('project.projectName')
          .field('GROUP_CONCAT(team_table.userID)', 'team')
          .field('project.hackathon')
          .join(this.teamTableName, 'team_table', 'project.projectID = team_table.projectID')
          .group('project.projectID'),
        'innerquery',
      )
      .field('GROUP_CONCAT(category_table.categoryID)', 'categories')
      .fields(['innnerquery.projectID', 'innerquery.projectName', 'innerquery.team', 'table_assignment.tableNumber'])
      .left_join(
        this.tableAssignmentTableName,
        'table_assignment',
        'innerquery.projectID = table_assignment.projectID',
      )
      .group('project.projectID');
    if (opts && opts.userId) {
      queryBuilder = queryBuilder.where('innerquery.team LIKE %?%', opts.userId);
    }
    if (opts && opts.categoryId) {
      queryBuilder = queryBuilder.where('categories LIKE %?%', opts.categoryId);
    }
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'innerquery.hackathon = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }
    return queryBuilder;
  }
}
