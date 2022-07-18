const axios = require('axios').default;
const config = require('./config.json');
const parsed = new Map();
let users = new Map();

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
                    // console.log(set.commit.author.name)
                    let user = users.get(set.commit.author.name)
                    users.set(set.commit.author.name, user ? [...user, set] : [set])
                }
            })
            return;
        }
    } catch (error) {
        console.log('[ERROR]', error.response?.data.message ?? error)
    }
}

(async () => {
    await getCommits();
    for (const [user, commits] of users) console.log(`${user} made ${commits.length} commit(s) since ${new Date(dateToSearch).toLocaleString()}`)
})()