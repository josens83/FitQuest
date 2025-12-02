# FitQuest Load Testing

K6 기반 부하 테스트 스위트

## 설치

```bash
# K6 설치 (macOS)
brew install k6

# K6 설치 (Linux)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# K6 설치 (Windows)
choco install k6
```

## 테스트 유형

### 1. Smoke Test (스모크 테스트)
시스템이 기본적으로 작동하는지 빠르게 확인

```bash
k6 run scripts/smoke-test.js
```

- **VUs**: 5
- **Duration**: 3분
- **목적**: 배포 후 빠른 검증

### 2. Load Test (부하 테스트)
예상 트래픽 수준에서 성능 검증

```bash
k6 run scripts/load-test.js
```

- **VUs**: 50-100
- **Duration**: 16분
- **목적**: 일반적인 부하에서 성능 측정

### 3. Stress Test (스트레스 테스트)
시스템의 한계점 파악

```bash
k6 run scripts/stress-test.js
```

- **VUs**: 100-300 (점진적 증가)
- **Duration**: 26분
- **목적**: 시스템 한계 파악

### 4. Spike Test (스파이크 테스트)
급격한 트래픽 증가 시 동작 확인

```bash
k6 run scripts/spike-test.js
```

- **VUs**: 100 → 1000 (급격한 증가)
- **Duration**: 12분
- **목적**: 프로모션, 이벤트 시 대비

### 5. Workout Flow Test (워크플로우 테스트)
실제 사용자 시나리오 시뮬레이션

```bash
k6 run scripts/workout-flow.js
```

- **시나리오**: Casual, Active, Power 사용자
- **Duration**: 9분
- **목적**: 실제 사용 패턴 테스트

## 환경 변수

```bash
# 기본 URL 설정
export BASE_URL=http://localhost:3001

# 테스트 사용자 인증 정보
export TEST_EMAIL=loadtest@fitquest.com
export TEST_PASSWORD=LoadTest123!
```

## 결과 출력

### Console 출력
```bash
k6 run scripts/load-test.js
```

### JSON 출력
```bash
k6 run --out json=results.json scripts/load-test.js
```

### HTML 리포트 (k6-reporter 필요)
```bash
k6 run --out json=results.json scripts/load-test.js
# 별도 도구로 HTML 변환
```

### InfluxDB + Grafana
```bash
k6 run --out influxdb=http://localhost:8086/k6 scripts/load-test.js
```

## 임계값 (Thresholds)

| 테스트 유형 | P95 응답시간 | 에러율 |
|------------|------------|--------|
| Smoke | < 500ms | < 1% |
| Load | < 500ms | < 1% |
| Stress | < 1000ms | < 5% |
| Spike | < 2000ms | < 10% |

## CI/CD 통합

```yaml
# GitHub Actions 예시
- name: Run Load Tests
  run: |
    k6 run --out json=results.json tests/load/scripts/smoke-test.js

- name: Check Results
  run: |
    # 실패 시 CI 실패 처리 (k6가 threshold 실패 시 exit code 99 반환)
    echo "Load test completed"
```

## 모범 사례

1. **테스트 데이터 격리**: 테스트 전용 사용자/데이터 사용
2. **점진적 부하**: 급격한 부하 증가 대신 램프업 사용
3. **실제 시나리오**: 실제 사용 패턴 반영
4. **모니터링 병행**: 테스트 중 시스템 메트릭 모니터링
5. **정기 실행**: 릴리스 전 및 정기적으로 실행
