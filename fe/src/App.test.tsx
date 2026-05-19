import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

test('Kiểm tra nút count tăng số khi click', async () => {
  render(<App />);
  
  // 1. Tìm cái nút có chữ "Count is 0"
  const button = screen.getByRole('button');
  expect(button.innerHTML).toBe('Count is 0');

  // 2. Mô phỏng hành động click chuột vào nút
  fireEvent.click(button);

  // 3. Kiểm tra xem nó có tăng lên 1 chưa
  expect(button.innerHTML).toBe('Count is 1');
});