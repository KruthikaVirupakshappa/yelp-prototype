# JMeter Performance Test Report

## Test Setup

- Test plan: `jmeter/yelp_load_test.jmx`
- Target host: 
- Target port: 
- Ramp-up time: 
- Loop count: 1
- Endpoint set:
  - `POST /api/auth/login`
  - `GET /api/restaurants/`
  - `POST /api/reviews/`

## Results Summary

| Concurrent Users | Avg Response Time (ms) | Throughput (req/sec) | Error Rate (%) |
| --- | ---: | ---: | ---: |
| 100 |  |  |  |
| 200 |  |  |  |
| 300 |  |  |  |
| 400 |  |  |  |
| 500 |  |  |  |

## Graph

Add a line chart with concurrency on the x-axis and average response time on the y-axis.

## Screenshots

- Summary Report screenshot:
- Aggregate Report screenshot:
- Any additional screenshot showing errors or spikes:

## Analysis

Explain how response time, throughput, and error rate changed as concurrency increased.

Possible bottlenecks to comment on:

- Database contention during login or review writes
- Kafka publish latency during review submission
- Increased latency from FastAPI request processing under higher thread counts
- Network or container resource saturation
