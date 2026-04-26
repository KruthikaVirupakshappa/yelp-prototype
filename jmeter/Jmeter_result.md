#JMeter Performance Testing

## JMeter Test Plan

- Test plan file: `jmeter/yelp_load_test.jmx`
- APIs covered:
  - `POST /api/auth/login` (User authentication)
  - `GET /api/restaurants/` with search/filter params (Restaurant search)
  - `POST /api/reviews/` (Review submission, Kafka flow)

## Results Summary (from JTL files)

| Concurrency (users) | Samples | Avg Response Time (ms) | Throughput (req/sec) | Error Rate (%) |
| --- | ---: | ---: | ---: | ---: |
| 100 | 500 | 157.24 | 16.47 | 0.00 |
| 200 | 1000 | 217.46 | 32.76 | 0.00 |
| 300 | 1500 | 589.07 | 47.73 | 0.00 |
| 400 | 2000 | 2811.39 | 45.85 | 0.00 |
| 500 | 2500 | 5689.25 | 41.10 | 0.00 |

## Performance Analysis

- Throughput increases from 16.47 req/sec at 100 users to 47.73 req/sec at 300 users, showing the system still scales into the mid-load range.
- At 400 and 500 users, average response time rises sharply (2811.39 ms and 5689.25 ms), which indicates queueing and saturation under heavier load.
- Throughput peaks around 300 users and then declines slightly at 400 and 500 users (47.73 -> 45.85 -> 41.10 req/sec), which matches a saturated backend.
- Error rate remains 0.00%, so the main bottleneck under higher load is latency/capacity, not request correctness.
- Likely bottlenecks at high concurrency:
  - Database contention for auth/review writes
  - Kafka publish path overhead during review processing
  - API server worker/thread saturation and request queueing

## Graph

- Concurrency on x-axis, average response time on y-axis
- Generated chart: `jmeter/avg_response_vs_concurrency.png`

## Latest Test Files

- `jmeter/100.jtl`
- `jmeter/200.jtl`
- `jmeter/300.jtl`
- `jmeter/400.jtl`
- `jmeter/500.jtl`
