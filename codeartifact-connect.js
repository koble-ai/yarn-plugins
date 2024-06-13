module.exports = {
    name: `codeartifact-connect`,
    factory: require => {
        const { exec } = require('child_process');
        return {
            hooks: {
                async validateProject(project, report) {
                    return await new Promise((resolve, reject) => {
                        const domain = project.configuration.env.CODE_ARTIFACT_DOMAIN;
                        exec(
                            `aws codeartifact get-authorization-token --domain ${domain} --domain-owner $AWS_ACCOUNT_ID --query authorizationToken --region $AWS_REGION --output text`,
                            { env: project.configuration.env },
                            (error, stdout, stderr) => {
                                if (stdout?.trim()) {
                                    const token = stdout.trim();
                                    project.configuration.values?.
                                        get('npmScopes')?.
                                        get(domain)?.
                                        set('npmAuthToken', token);
                                    project.configuration.values?.
                                        get('npmRegistries')?.
                                        get(domain)?.
                                        set('npmAuthToken', token);
                                    console.log(`Updated ${domain} codeartifact token`);
                                }
                                if (error !== null) {
                                    report.reportError(`codeartifact-connect error: ${error}`);
                                    reject(error);
                                }
                                resolve();
                            }
                        );
                    });
                }
            }
        };
    }
};
