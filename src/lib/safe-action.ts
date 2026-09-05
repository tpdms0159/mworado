// 서버 액션 호출 자체가 실패하는 경우(오프라인 등 네트워크 문제로 요청이 서버에
// 도달하지 못한 경우)를 잡아준다. 서버 액션 "내부"의 에러는 각 액션이 이미
// { error } 형태로 반환하지만, 요청 자체가 안 나가는 경우는 그 try/catch가
// 실행조차 안 되므로 클라이언트 쪽에서 한 번 더 감싸야 한다.
const OFFLINE_ERROR = "네트워크에 문제가 있는 것 같아요. 잠시 후 다시 시도해 주세요.";

export async function safeAction<T extends { error?: string }>(
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch {
    return { error: OFFLINE_ERROR } as T;
  }
}
