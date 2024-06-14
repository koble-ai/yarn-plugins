
const getToken = async (env, require) => {
    const { exec } = require('child_process');
    const domain = env.CODE_ARTIFACT_DOMAIN;
    return await new Promise((resolve, reject) => {
        exec(
            `aws codeartifact get-authorization-token --domain ${domain} --domain-owner $AWS_ACCOUNT_ID --query authorizationToken --region $AWS_REGION --output text`,
            { env },
            (error, stdout, stderr) => {
                if (stdout?.trim()) {
                    resolve(stdout.trim())
                }
                if (error !== null) {
                    reject(error);
                }
                resolve();
            })
    })
}

const setToken = ({ project, domain, token }) => {
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

const hasToken = ({ project, domain }) => {
    return project.configuration.values?.
        get('npmScopes')?.
        get(domain)?.
        get('npmAuthToken') && project.configuration.values?.
            get('npmRegistries')?.
            get(domain)?.
            get('npmAuthToken');
}

module.exports = {
    name: `codeartifact-connect`,
    factory: (require) => {
        return {
            hooks: {
                /**
                 * @param {Project} project 
                 * @param {{
                 *  reportWarning: (name: string, text: string) => void;
                 *  reportError: (name: string, text: string) => void;
                 * }} report 
                 */
                async validateProject(project, report) {
                    const domain = project.configuration.env.CODE_ARTIFACT_DOMAIN;
                    try {
                        const token = await getToken(project.configuration.env, require);
                        setToken({ project, domain, token })
                    } catch (error) {
                        report.reportError(`codeartifact-connect error: ${error}`);
                    }
                },
                /**
                 * @param {() => Promise<Response>} executor 
                 * @param {WrapNetworkRequestInfo} info 
                 * @returns {Promise<() => Promise<Response>>}
                 */
                async wrapNetworkRequest(executor, info) {
                    const env = info.configuration.env;
                    const domain = env.CODE_ARTIFACT_DOMAIN;
                    if (!info.target.match(`https://${domain}-${env.AWS_ACCOUNT_ID}.d.codeartifact.${env.AWS_REGION}.amazonaws.com/npm/${domain}`)) {
                        return executor
                    }
                    if (hasToken({ project: info, domain })) {
                        return executor;
                    }
                    const token = await getToken(env, require);
                    setToken({ project: info, domain, token });
                    info.headers.authorization = `Bearer ${token}`;
                    throw new Error("bad")
                }
            }
        };
    }
};
