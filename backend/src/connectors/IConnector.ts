
import { IDeployment } from '../models/Deployment';

export interface IConnector {
    deploy(deployment: IDeployment): Promise<void>;
    handleWebhook(payload: any, deployment: IDeployment, headers?: Record<string, any>, rawBody?: string): Promise<void>;
}
