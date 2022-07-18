const axios = require('axios').default;
// const config = require('./config.json') ?? null;
const { writeFileSync, readFileSync, existsSync } = require('node:fs');
const { resolve } = require('path')
const _configExist = existsSync(resolve(process.cwd() + '/config.json')) ? true : false;
if(!_configExist) {
    console.log(existsSync(resolve(process.cwd() + '/config.json')))
    console.log("[ERROR] 'config.json' doesn't exist.", resolve(process.cwd() + '/config.json'), process.cwd())
    process.exit(1)
}
const _import = readFileSync(resolve(process.cwd() + '/config.json'));
const config = JSON.parse(_import);

// Setup map for all users found commits
let userCommits = new Map();

// set a date for going back a cetain amount of daysin commit log
let dateToSearch = new Date();
let previousDate = new Date().getDate() - config.daysBack;
dateToSearch.setDate(previousDate);


async function getCommits() {
    const options = {
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `token ${config.token}`
        }
    }

    try {
        const response = await axios.get(`https://api.github.com/repos/${config.repoOwner}/${config.repo}/commits?per_page=100&since=${dateToSearch}`, options);
        if(response.data.length > 0 && response.data) {
            response.data.map(set => {
                if(!set.commit.author.name.includes('github-actions')){
                    let user = userCommits.get(set.commit.author.name)
                    userCommits.set(set.commit.author.name, user ? [...user, set] : [set])
                }
            })
            return true;
        }
    } catch (error) {
        console.log('[ERROR]', error.response?.data.message ?? error)
        return false;
    }
}

(async () => {
    const _res = await getCommits();
    if(!_res) return process.exit(1)
    let result = [];
    console.log(`Time: ${config.daysBack} day(s)`)
    console.log('\n--------------------------------------------------')
    for (const [user, commits] of userCommits) {
        // for(const _commit of commits){
        //     console.log(user, _commit.html_url)
        // }
        console.log(`${user} made ${commits.length} commit(s)`)
        console.log(`SHA(s): ${commits.map(s => s.sha.substr(0, 7) ).join(' | ')}`)
        console.log('--------------------------------------------------')
        result.push({user, commits: commits.map(s => s.commit.message.replace(/(\r\n\r\n|\r\n|\n\n|\n)/gm, ' | '))})
    }
    setTimeout(() => {
        console.log(result)
        writeFileSync(resolve(process.cwd() + '/results.json'), JSON.stringify(result, null, 2))
        process.exit(1)
    }, 2000)

})()

