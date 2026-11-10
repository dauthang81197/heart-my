import Logo from '../components/Logo';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const CONTACT = 'hello@truenote.online'; // TODO: đổi thành email liên hệ thật
const UPDATED = '10/11/2026';

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="legal">
      <Logo to="/" style={{ marginBottom: 24 }} />
      <h1>{title}</h1>
      <p className="muted">Cập nhật lần cuối: {UPDATED}</p>
      {children}
      <p className="muted" style={{ marginTop: 32 }}><Link to="/terms">Điều khoản sử dụng</Link> · <Link to="/privacy">Chính sách riêng tư</Link> · Liên hệ: <a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </div>
  );
}

export function Terms() {
  return (
    <Shell title="Điều khoản sử dụng">
      <h2>1. Dịch vụ</h2>
      <p>TrueNote là dịch vụ soạn và gửi thư tay kỹ thuật số: bạn thiết kế phong bì, giấy viết, đính kèm ảnh hoặc ghi âm, rồi gửi cho một người, đăng công khai hoặc hẹn giờ gửi. Khi sử dụng dịch vụ, bạn đồng ý với các điều khoản dưới đây.</p>
      <h2>2. Tài khoản</h2>
      <ul>
        <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động trên tài khoản của mình.</li>
        <li>Thông tin đăng ký phải chính xác. Chúng tôi có thể tạm khoá tài khoản có dấu hiệu gian lận hoặc vi phạm.</li>
        <li>Bạn có thể tự xoá tài khoản bất cứ lúc nào tại <b>Tuỳ chỉnh → Xoá tài khoản</b>.</li>
      </ul>
      <h2>3. Tem thư và thanh toán</h2>
      <ul>
        <li>Mỗi lá thư gửi đi cần một tem. Tem được mua bằng chuyển khoản VietQR theo giá hiển thị tại thời điểm mua.</li>
        <li>Tem đã được cộng vào tài khoản thì không quy đổi thành tiền và không hoàn lại, trừ trường hợp lỗi hệ thống do chúng tôi gây ra.</li>
        <li>Nếu bạn đã chuyển khoản nhưng chưa thấy tem sau ít phút, hãy liên hệ kèm mã đơn hàng để được hỗ trợ đối soát.</li>
      </ul>
      <h2>4. Nội dung của bạn</h2>
      <ul>
        <li>Bạn giữ quyền sở hữu nội dung mình tạo ra và chịu trách nhiệm về nội dung đó. Bạn cấp cho TrueNote quyền lưu trữ và hiển thị nội dung để cung cấp dịch vụ (đến người nhận, hoặc công khai nếu bạn chọn gửi công khai).</li>
        <li>Thư gửi riêng tư chỉ truy cập được qua liên kết dành cho người nhận. Ai nắm liên kết đều có thể mở thư, vì vậy hãy chỉ chia sẻ liên kết với người bạn tin tưởng.</li>
        <li>Không đăng nội dung vi phạm pháp luật, xâm phạm quyền của người khác, quấy rối, thù ghét, khiêu dâm, lừa đảo, spam hoặc chứa mã độc.</li>
        <li>Không dùng dịch vụ để gửi email hàng loạt không được yêu cầu.</li>
      </ul>
      <h2>5. Báo cáo và gỡ nội dung</h2>
      <p>Bất kỳ ai cũng có thể báo cáo thư công khai vi phạm bằng nút <b>Báo cáo</b>. Chúng tôi có quyền ẩn hoặc xoá nội dung vi phạm, và khoá tài khoản vi phạm nhiều lần, mà không cần báo trước.</p>
      <h2>6. Miễn trừ và giới hạn trách nhiệm</h2>
      <p>Dịch vụ được cung cấp "như hiện có". Chúng tôi cố gắng vận hành ổn định nhưng không cam kết dịch vụ không bao giờ gián đoạn hoặc không lỗi. Trong phạm vi pháp luật cho phép, chúng tôi không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc sử dụng dịch vụ, và trách nhiệm tối đa không vượt quá số tiền bạn đã thanh toán trong 3 tháng gần nhất.</p>
      <h2>7. Thay đổi điều khoản</h2>
      <p>Chúng tôi có thể cập nhật điều khoản này. Việc tiếp tục sử dụng dịch vụ sau khi cập nhật nghĩa là bạn chấp nhận nội dung mới.</p>
      <h2>8. Liên hệ</h2>
      <p>Mọi thắc mắc, khiếu nại: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
    </Shell>
  );
}

export function Privacy() {
  return (
    <Shell title="Chính sách riêng tư">
      <p>Chính sách này giải thích TrueNote thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn như thế nào, phù hợp với quy định về bảo vệ dữ liệu cá nhân tại Việt Nam (Nghị định 13/2023/NĐ-CP).</p>
      <h2>1. Dữ liệu chúng tôi thu thập</h2>
      <ul>
        <li><b>Tài khoản:</b> email, tên hiển thị, ảnh đại diện (nếu đăng nhập Google), mật khẩu (lưu dưới dạng băm, không lưu mật khẩu gốc).</li>
        <li><b>Nội dung thư:</b> thiết kế, văn bản, hình vẽ, ảnh và bản ghi âm bạn tải lên; email và tên người nhận bạn nhập.</li>
        <li><b>Giao dịch:</b> mã đơn, số tiền, thời điểm thanh toán tem. Chúng tôi không lưu số thẻ hay thông tin tài khoản ngân hàng của bạn.</li>
        <li><b>Kỹ thuật:</b> địa chỉ IP và nhật ký truy cập, dùng để chống lạm dụng và khắc phục sự cố. Trình duyệt lưu mã đăng nhập (localStorage) và lựa chọn ngôn ngữ.</li>
      </ul>
      <h2>2. Mục đích sử dụng</h2>
      <ul>
        <li>Cung cấp dịch vụ: tạo tài khoản, lưu và gửi thư, gửi email thông báo cho người nhận, xử lý thanh toán tem.</li>
        <li>Bảo mật và chống gian lận, xử lý báo cáo vi phạm.</li>
        <li>Hỗ trợ và liên hệ khi bạn yêu cầu.</li>
      </ul>
      <h2>3. Chia sẻ dữ liệu</h2>
      <p>Chúng tôi không bán dữ liệu cá nhân. Dữ liệu chỉ được chia sẻ trong phạm vi cần thiết với:</p>
      <ul>
        <li><b>Người nhận thư</b> (và công chúng, nếu bạn chọn gửi công khai): nội dung thư và tên hiển thị của bạn.</li>
        <li><b>Nhà cung cấp hạ tầng:</b> máy chủ lưu trữ, Cloudflare R2 (lưu ảnh, âm thanh), dịch vụ gửi email.</li>
        <li><b>Google</b> (nếu bạn đăng nhập bằng Google) và <b>SePay/VietQR</b> (đối soát thanh toán).</li>
        <li>Cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp.</li>
      </ul>
      <h2>4. Thời gian lưu trữ</h2>
      <p>Chúng tôi lưu dữ liệu trong thời gian tài khoản còn hoạt động. Khi bạn xoá tài khoản, toàn bộ thư, ảnh liên kết trong thư và kho tem được xoá; hồ sơ được ẩn danh. Thông tin giao dịch được giữ lại cho mục đích kế toán theo quy định pháp luật.</p>
      <h2>5. Quyền của bạn</h2>
      <ul>
        <li>Xem và chỉnh sửa thông tin tại <b>Tuỳ chỉnh</b>.</li>
        <li>Xoá tài khoản và dữ liệu tại <b>Tuỳ chỉnh → Xoá tài khoản</b>.</li>
        <li>Yêu cầu truy cập, chỉnh sửa, hạn chế xử lý hoặc rút lại sự đồng ý bằng cách liên hệ chúng tôi.</li>
      </ul>
      <h2>6. Bảo mật</h2>
      <p>Chúng tôi áp dụng mã hoá kết nối (HTTPS), băm mật khẩu, giới hạn tần suất truy cập và kiểm soát quyền truy cập. Tuy nhiên không hệ thống nào an toàn tuyệt đối; hãy giữ kín mật khẩu và liên kết thư riêng tư của bạn.</p>
      <h2>7. Trẻ em</h2>
      <p>Dịch vụ không dành cho người dưới 16 tuổi. Nếu bạn phát hiện trẻ em đã đăng ký, hãy liên hệ để chúng tôi xoá tài khoản.</p>
      <h2>8. Liên hệ</h2>
      <p>Mọi yêu cầu về dữ liệu cá nhân: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
    </Shell>
  );
}
