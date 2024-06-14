
module.exports = {
    name: `codeartifact-connect`,
    factory: (require) => {
        const { exec } = require('child_process');
        const getToken = async (env) => {
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

        const getCodeArtifactUrl = (env) => {
            const domain = env.CODE_ARTIFACT_DOMAIN;
            return `https://${domain}-${env.AWS_ACCOUNT_ID}.d.codeartifact.${env.AWS_REGION}.amazonaws.com/npm/${domain}`
        }

        const needsToken = (project) => {
            const env = project.configuration.env;
            const domain = env.CODE_ARTIFACT_DOMAIN;
            const url = getCodeArtifactUrl(env)
            const npmScopes = project.configuration.values.
                get('npmScopes')
            const npmRegistries = project.configuration.values.
                get('npmRegistries');
            if (!npmScopes && !npmRegistries) {
                return false;
            }
            if (npmScopes?.has(domain) && !npmScopes?.get(domain).
                get('npmAuthToken')) {
                return true;
            }
            if (npmRegistries?.has(url) && !npmRegistries?.get(url).
                get('npmAuthToken')) {
                return true;
            }
            return false;
        }

        const setToken = async (project) => {
            if (!needsToken(project)) {
                return;
            }
            const env = project.configuration.env;
            const domain = env.CODE_ARTIFACT_DOMAIN;
            const token = await getToken(env);
            const url = getCodeArtifactUrl(env)
            const values = project.configuration.values;
            values?.
                get('npmScopes')?.
                get(domain)?.
                set('npmAuthToken', token);
            values?.
                get('npmRegistries')?.
                get(url)?.
                set('npmAuthToken', token);
            console.log(`Updated ${domain} codeartifact token`);
        }
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
                    try {
                        await setToken(project)
                    } catch (error) {
                        report.reportError(`codeartifact-connect error: ${error}`);
                    }
                },
                /**
                 * 
                 * @param {Project} project 
                 * @param {NodeJS.ProcessEnv} env 
                 * @param {(name: string, argv0: string, args: Array<string>) => Promise<void>} makePathWrapper 
                 */
                async setupScriptEnvironment(project) {
                    try {
                        await setToken(project);
                    } catch (ex) {
                        console.warn(ex);
                    }
                }
            }
        };
    }
};
