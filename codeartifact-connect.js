module.exports = {
    name: `codeartifact-connect`,
    factory: (require) => {
      const { exec } = require('child_process');
      /**
       * @param {Record<string, string>} env
       * @returns {Promise<string>} token
       */
      const getToken = async (env) => {
        const domain = env.CODE_ARTIFACT_DOMAIN;
        return await new Promise((resolve, reject) => {
          try {
            exec(
              `aws codeartifact get-authorization-token --domain ${domain} --domain-owner $AWS_ACCOUNT_ID --query authorizationToken --region $AWS_REGION --output text`,
              { env },
              (error, stdout, stderr) => {
                if (stdout?.trim()) {
                  resolve(stdout.trim());
                }
                if (error !== null) {
                  reject(error);
                }
                resolve();
              }
            );
          } catch (ex) {
            reject(ex);
          }
        });
      };
  
      const getCodeArtifactUrl = (env) => {
        const domain = env.CODE_ARTIFACT_DOMAIN;
        return `https://${domain}-${env.AWS_ACCOUNT_ID}.d.codeartifact.${env.AWS_REGION}.amazonaws.com/npm/${domain}`;
      };
  
      const needsToken = (project) => {
        const env = project.configuration.env;
        const npmScopes = project.configuration.values.get('npmScopes');
        const npmRegistries = project.configuration.values.get('npmRegistries');
        if (!npmScopes && !npmRegistries) {
          return false;
        }
        const domain = env.CODE_ARTIFACT_DOMAIN;
        if (
          npmScopes?.has(domain) &&
          !npmScopes?.get(domain).get('npmAuthToken')
        ) {
          return true;
        }
        const url = getCodeArtifactUrl(env);
        if (
          npmRegistries?.has(url) &&
          !npmRegistries?.get(url).get('npmAuthToken')
        ) {
          return true;
        }
        return false;
      };
  
      const setToken = async (project) => {
        const env = project.configuration.env;
        const domain = env.CODE_ARTIFACT_DOMAIN;
        const token = await getToken(env);
        const url = getCodeArtifactUrl(env);
        const values = project.configuration.values;
        values?.get('npmScopes')?.get(domain)?.set('npmAuthToken', token);
        values?.get('npmRegistries')?.get(url)?.set('npmAuthToken', token);
        console.log(`Updated ${domain} codeartifact token`);
        return token;
      };
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
              if (!needsToken(project)) {
                return;
              }
              await setToken(project);
            } catch (error) {
              report.reportError(`codeartifact-connect error: ${error}`);
            }
          },
          // /**
          //  *
          //  * @param {Project} project
          //  * @param {NodeJS.ProcessEnv} env
          //  * @param {(name: string, argv0: string, args: Array<string>) => Promise<void>} makePathWrapper
          //  */
          // async setupScriptEnvironment(project) {
          //   try {
          //     if (!needsToken(project)) {
          //       return;
          //     }
          //     await setToken(project);
          //   } catch (ex) {
          //     console.warn(ex);
          //   }
          // },
          /**
           * @param {() => Promise<Response>} executor
           * @param {WrapNetworkRequestInfo} info
           * @returns {Promise<() => Promise<Response>>}
           */
          async wrapNetworkRequest(executor, info) {
            const url = getCodeArtifactUrl(info.configuration.env);
            if (!info.target.match(url)) {
              return executor;
            }
            if (!needsToken(info)) {
              return executor;
            }
            const token = await setToken(info);
            info.headers.authorization = `Bearer ${token}`;
            return executor;
          },
          /**
           * @param {Workspace} workspace
           * @param {object} rawManifest
           * @returns {Promise<void> | void}
           */
          async beforeWorkspacePacking({ project }) {
            if (!needsToken(project)) {
              return;
            }
            await setToken(project);
          }
        }
      };
    }
  };
  