import Queue from 'bull';

const deploymentQueue = new Queue('deployment', {
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
});

export default deploymentQueue;