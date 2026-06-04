import { register } from '../registry.js'
import { handleTopic1, TOPIC as topic1 } from './topic1.js'
import { handleTopic2, TOPIC as topic2 } from './topic2.js'
import { handleTopic3, TOPIC as topic3 } from './topic3.js'
import { handleTopic4, TOPIC as topic4 } from './topic4.js'
import { handleTopic5, TOPIC as topic5 } from './topic5.js'
import { handleEdge5Video, TOPIC as edge5Video } from './edge5-video.js'

register(topic1, handleTopic1)
register(topic2, handleTopic2)
register(topic3, handleTopic3)
register(topic4, handleTopic4)
register(topic5, handleTopic5)
register(edge5Video, handleEdge5Video)
