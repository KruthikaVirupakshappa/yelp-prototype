# JMeter Performance Testing

Use `jmeter/yelp_load_test.jmx` to evaluate the backend at 100, 200, 300, 400, and 500 concurrent users.

## What the plan covers

- User authentication via `POST /api/auth/login`
- Restaurant search and filtering via `GET /api/restaurants/`
- Review submission via `POST /api/reviews/`
- Unique signups per virtual user so the review flow remains valid under load

## How to run

1. Open the test plan in Apache JMeter.
2. Set `HOST` and `PORT` to your deployment target.
3. Run the plan five times with `THREADS` set to `100`, `200`, `300`, `400`, and `500`.
4. Keep `RAMP_UP` consistent across runs so the comparison is fair.
5. Export or screenshot the `Summary Report` and `Aggregate Report` after each run.

Example CLI run:

```bash
jmeter -n -t jmeter/yelp_load_test.jmx -JTHREADS=100 -JHOST=localhost -JPORT=80 -l results-100.jtl
```

## What to record for each run

- Average response time
- Throughput in requests/sec
- Error rate

## Submission checklist

- `jmeter/yelp_load_test.jmx`
- Screenshots of JMeter results
- A results summary table for all five concurrency levels
- A graph with concurrency on the x-axis and average response time on the y-axis
- A short analysis of bottlenecks and why performance changes as load increases
