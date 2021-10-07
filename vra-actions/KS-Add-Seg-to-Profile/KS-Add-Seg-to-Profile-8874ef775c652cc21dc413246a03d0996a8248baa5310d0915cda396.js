/** Add provisioned segments to a specified network profile
 * triggered by the event of "Network post provisioning"
 */
const axios = require('axios');
const urlbase = 'https://api.mgmt.cloud.vmware.com';

exports.handler = async function handler(context, inputs) {
    const outputs = {};
    const config = {
	    headers: {
		    'Content-type': 'application/json',
			'Accept': 'application/json'
		}
	};
	if (inputs.componentTypeId != "Cloud.NSX.Network" || inputs.customProperties.profile == "NONE") {
	    console.log('did nothing');
	    return outputs;
	}
	console.log(`inputs.subnetIds: ${inputs.subnetIds}`);
	
    let data = { refreshToken: context.getSecret(inputs.apiToken) };
    let res = await axios.post(urlbase + '/iaas/api/login', data, config);
    if (res.status != 200) {
        console.log(`POST /iaas/api/login: ${res.status} ${res.statusText}`);
        return outputs;
    }
    config.headers.Authorization = 'Bearer ' + res.data.token;

    res = await axios.get(urlbase + '/iaas/api/network-profiles', config);
    let nwpro = res.data.content.find(v => v.name == inputs.customProperties.profile);
    let nwIds = nwpro._links["fabric-networks"].hrefs.map(v => v.split('/')[4]);
    
    data = {
        name: nwpro.name,
        id: nwpro.id,
        fabricNetworkIds: nwIds.concat(inputs.subnetIds)
    }
    res = await axios.patch(urlbase + '/iaas/api/network-profiles/' + nwpro.id, data, config);
    console.log(`PATCH /iaas/api/network-profiles/${nwpro.id}: ${res.status} ${res.statusText}`);

    return outputs;
};
