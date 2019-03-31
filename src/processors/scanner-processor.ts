import { Inject, Injectable } from 'injection-js';
import moment, { unitOfTime } from 'moment';
import { HttpError } from '../js-common/errors';
import { Event } from '../models/event/event';
import { IActiveHackathonDataMapper } from '../models/hackathon/active-hackathon';
import { IRegisterDataMapper } from '../models/register';
import { IScannerDataMapper } from '../models/scanner';
import { RfidAssignment } from '../models/scanner/rfid-assignment';
import { Scan } from '../models/scanner/scan';
import { ResponseBody } from '../router/router-types';
import { IApikeyAuthService } from '../services/auth/auth-types';
import { IDataMapperHackathonSpecific, IDbResult } from '../services/database';

export interface IScannerProcessor {
  processRfidAssignments(inputAssignments: any | any[]): Promise<ResponseBody>;

  processorScannerConfirmation(pin: number, macAddress: string): Promise<ResponseBody>;

  getRelevantEvents(filterForRelevant: boolean): Promise<ResponseBody>;

  processScans(scans: any | any[]): Promise<ResponseBody>;

  getUserByCurrentPin(pin: number): Promise<ResponseBody>;
}

@Injectable()
export class ScannerProcessor implements IScannerProcessor {

  /**
   * This function acts as a filter predicate
   * It returns true if the current time is within the amount of
   * time provided
   */
  private static relevantEventsFilter(
    value: Event,
    amount: number,
    unit: unitOfTime.Base,
  ): boolean {
    return moment()
      .isBetween(
        moment.unix(value.event_start_time / 1000).subtract(amount, unit),
        moment.unix(value.event_end_time / 1000).add(amount, unit),
      );
  }

  /**
   * This function returns the appropriate unit for the search function implemented in
   * searchForRelevantEvents(). Based on the iteration number, it will return the appropriate unit
   */
  private static unitsStepFunction(int: number) {
    if (int < 0) {
      throw new Error('Illegal value');
    }
    switch (Math.floor(int / 5)) {
      case 0:
        return 'minutes';
      case 1:
        return 'hours';
      case 2:
        return 'days';
      case 3:
        return 'weeks';
      case 4:
        return 'months';
      default:
        return 'years';
    }
  }

  private searchAmount: number;
  constructor(
    @Inject('IScannerDataMapper') protected readonly scannerDataMapper: IScannerDataMapper,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IScannerAuthService') protected readonly scannerAuthService: IApikeyAuthService,
    @Inject('IEventDataMapper') private readonly eventDataMapper: IDataMapperHackathonSpecific<Event>,
  ) {
    this.searchAmount = 15;
  }

  public async processRfidAssignments(inputAssignments: any | any[]) {
    let response: ResponseBody;
    if (Array.isArray(inputAssignments)) {
      const assignments: RfidAssignment[] = inputAssignments.map(
        assignment => new RfidAssignment(assignment));
      const result = await this.scannerDataMapper.addRfidAssignments(assignments);
      const { responseResult, status } = this.getBatchProcessResult(result);

      response = new ResponseBody(
        'Success',
        status.status,
        { result: status.response, data: responseResult },
      );
    } else {
      const assignment = new RfidAssignment(inputAssignments);
      const result = await this.scannerDataMapper.insert(assignment);
      response = new ResponseBody(
        'Success',
        200,
        result as IDbResult<RfidAssignment>,
      );
    }
    return response;
  }

  public async processorScannerConfirmation(pin: number, macAddress: string) {
    const result = await this.scannerAuthService.checkPinAuthentication(pin);
    if (!result) {
      throw new HttpError('invalid authentication pin provided', 401);
    }
    const apiToken = await this.scannerAuthService.generateApiKey(macAddress);
    return new ResponseBody('Success', 200, { result: 'Success', data: apiToken });
  }

  public async getRelevantEvents(filterForRelevant: boolean): Promise<ResponseBody> {
    const { data } = await this.eventDataMapper.getAll({ byHackathon: true, ignoreCache: true });
    let relevantEvents = data;
    if (filterForRelevant) {
      relevantEvents = this.searchForRelevantEvents(data)
        .sort((a, b) =>
          a.event_start_time < b.event_start_time ? -1 :
            a.event_start_time === b.event_start_time ? 0 : -1);
    }
    return new ResponseBody(
      'Success',
      200,
      { data: relevantEvents, result: 'Success' },
    );
  }

  public async processScans(inputScans: any | any[]): Promise<ResponseBody> {
    let response: ResponseBody;
    if (Array.isArray(inputScans)) {
      const scans: Scan[] = inputScans.map(
        scan => new Scan(scan));
      const result = await this.scannerDataMapper.addScans(scans);
      const { responseResult, status } = this.getBatchProcessResult(result);

      response = new ResponseBody(
        'Success',
        status.status,
        { result: status.response, data: responseResult },
      );
    } else {
      const scan = new Scan(inputScans);
      const result = await this.scannerDataMapper.addSingleScan(scan);
      response = new ResponseBody(
        'Success',
        200,
        result as IDbResult<Scan>,
      );
    }
    return response;
  }

  /**
   * This function searches for "relevant" events with an increasing search radius until
   * it finds some events to send
   */
  public searchForRelevantEvents(data: Event[]): Event[] {
    let result: Event[];
    // Start search with minutes, and change the units to increase the search radius rapidly
    let lastUnit = ScannerProcessor.unitsStepFunction(0);
    let counter = 0;
    while (true) {
      const nextUnit = ScannerProcessor.unitsStepFunction(counter);
      if (lastUnit !== nextUnit) {
        // Restart search for new unit at search amount 1
        this.searchAmount = 1;
      }
      lastUnit = nextUnit;
      result = data.filter(
        value => ScannerProcessor.relevantEventsFilter(
          value,
          this.searchAmount,
          nextUnit,
        ));
      // Increase the search amount
      this.searchAmount += 2 + counter;
      if (result.length > 0) {
        // If events were found, reset the state of this file back to the initial state
        this.searchAmount = 15;
        return result;
      }
      counter += 1;
    }
  }

  public async getUserByCurrentPin(pin: number): Promise<ResponseBody> {
    const hackathon = await this.activeHackathonDataMapper.activeHackathon.toPromise();
    const registration = await this.registerDataMapper.getByPin(pin, hackathon);
    return new ResponseBody(
      'Success',
      200,
      registration,
    );
  }

  private getBatchProcessResult(result) {
    const responseResult: ResponseBody[] = result.data.map((idbResult) => {
      switch (idbResult.result) {
        case 'Error':
          return new ResponseBody(idbResult.result, 500, idbResult);
        case 'Duplicate detected':
          return new ResponseBody(idbResult.result, 409, idbResult);
        case 'Bad input':
          return new ResponseBody(idbResult.result, 400, idbResult);
        default:
          return new ResponseBody(idbResult.result, 200, { result: 'Success', data: undefined });
      }
    });
    // Find response status to send
    const status = this.getResponseStatus(responseResult);
    return { responseResult, status };
  }

  private getResponseStatus(responseResult): { status: number, response: string } {
    return responseResult.reduce(
      (
        previousStatus: { status: number, response: string },
        currentResponse: ResponseBody,
      ): { status: number, response: string } => {
        if (previousStatus.status !== currentResponse.status) {
          return { status: 207, response: 'Multi-status' };
        }
        return { status: currentResponse.status, response: currentResponse.api_response };
      },
      { status: responseResult[0].status, response: responseResult[0].api_response },
    );
  }
}
