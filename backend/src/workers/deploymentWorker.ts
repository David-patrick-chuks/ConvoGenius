
import deploymentQueue from '../queues/deploymentQueue';
import deploymentService from '../services/deploymentService';

deploymentQueue.process(async (job) => {
    console.log(`Processing job ${job.id} with data:`, job.data);

    const { deploymentId } = job.data;

    try {
        await deploymentService.deploy(deploymentId);
        console.log(`Deployment ${deploymentId} completed successfully`);
    } catch (error) {
        console.error(`Deployment ${deploymentId} failed:`, error);
    }
});
