import axios from 'axios'
import Config from '../../../common/config'

const getFloorPlanStream = async (rentalPropertyId: string) => {
  const url = `${Config.documentsService.url}/floorplan/${rentalPropertyId}`

  return await axios({
    method: 'get',
    url: url,
    responseType: 'stream',
    headers: {
      'Ocp-Apim-Subscription-Key': 'ac9c3fa0c9d04aca866e65b780002804',
    },
  })
}

export { getFloorPlanStream }
