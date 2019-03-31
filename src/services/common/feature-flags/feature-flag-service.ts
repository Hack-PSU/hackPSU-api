import * as fs from 'fs';
import { Injectable } from 'injection-js';
import { FeatureFlag } from './feature-flags-types';

@Injectable()
export class FeatureFlagService {

  private readonly initialized: boolean;
  private readonly featureFlags: Map<FeatureFlag, boolean>;

  constructor() {
    const path = '../../../feature_flags.json';
    const fileExists = fs.existsSync(path);
    this.initialized = false;
    if (fileExists) {
      this.featureFlags = this.generateFeatureFlagMap(
        JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' })),
      );
      this.initialized = true;
    }
  }

  public isFeatureEnabled(feature: FeatureFlag) {
    return this.featureFlags[feature];
  }

  private generateFeatureFlagMap(data: any) {
    const values: Array<[string, boolean]> = Object.entries(data);
    const map = new Map<FeatureFlag, boolean>();
    values.forEach(([key, value]) => {
      map.set(FeatureFlag[key], value);
    });
    return map;
  }
}
