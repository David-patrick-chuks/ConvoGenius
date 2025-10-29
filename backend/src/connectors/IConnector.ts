
import { IDeployment } from '../types';

export interface IConnector {
    deploy(deployment: IDeployment): Promise<void>;
    handleWebhook(payload: any, deployment: IDeployment, headers?: Record<string, any>, rawBody?: string): Promise<any | void>;
}
