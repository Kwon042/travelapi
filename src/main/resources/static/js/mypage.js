document.addEventListener("DOMContentLoaded", function () {
    let currentUserId;

    // 로그인한 사용자 ID를 서버에서 가져오는 함수
    function fetchCurrentUserId() {
        fetch('/user/getCurrentUserId') // 현재 사용자 ID를 반환하는 API 엔드포인트
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentUserId = data.userId; // 사용자 ID 저장
                } else {
                    console.error("Failed to retrieve the user ID.");
                }
            })
            .catch(error => console.error("An error occurred:", error));
    }
    // 페이지 로드 시 사용자 ID 가져옴
    fetchCurrentUserId();

    // 🔹 프로필 이미지 모달 열기
    function openProfileImageModal() {

        const modal = document.getElementById('profileImageModal');
        const input = document.getElementById('profileImageInput');

        if (modal) {
            modal.classList.remove('hidden');  // 'hidden' 클래스를 제거
            modal.classList.add('show'); // 'show' 클래스를 추가하여 모달 표시
        }
    }

    // 🔹 프로필 이미지 모달 닫기
    function closeProfileImageModal() {
        const modal = document.getElementById('profileImageModal');
        const input = document.getElementById('profileImageInput');
        if (modal) {
            modal.classList.add('hidden'); // 모달 닫기
            modal.classList.remove('show');
            input.value = '';  // 파일 입력 초기화
        } else {
            console.error("Unable to find the modal.");
        }
    }

    // 🔹 프로필 이미지 업로드
     window.uploadProfileImage = function() {
         const input = document.getElementById('profileImageInput');
         const file = input.files[0]; // 선택된 파일 가져오기

         if (!file) {
             alert("Choose the file.");
             return;
         }

         const formData = new FormData();
         formData.append('profileImage', file);
         formData.append('userId', currentUserId);

         // 서버로 파일 전송
         fetch('/api/image/user/uploadProfileImage', {
             method: 'POST',
             body: formData
         })
         .then(response => {
             if (!response.ok) {
                 return response.json().then(data => {
                     throw new Error(data.message || `서버에서 오류가 발생했습니다. 상태 코드: ${response.status}`);
                 });
             }
             return response.json(); // JSON 응답 처리
         })
         .then(data => {
             if (data.success) {
                 const profileImage = document.querySelector('.profile-image');

                 if (profileImage) {
                     if (data.newProfileImageUrl) {
                         profileImage.src = data.newProfileImageUrl; // 새 URL로 갱신
                     } else {
                         alert("새 프로필 이미지 URL이 없습니다.");
                         // 대체 이미지 경로로 변경
                         profileImage.src = '/images/default-profile.jpg';
                     }
                 }
                 alert("The profile image has been successfully uploaded.");
                 closeProfileImageModal();
             } else {
                 alert(data.message);
             }
         })
         .catch(error => {
             console.error("An error occurred during file upload: ", error);
             alert("An error occurred during file upload.");
         });
     }

    // 🔹 비밀번호 수정 폼 보이기/숨기기
    function togglePasswordForm() {
        const form = document.getElementById('changePasswordForm');
        form.style.display = (form.style.display === "none") ? "block" : "none";
    }

    // 🔹 사용자 정보 수정 모달 열기
    function openEditModal(field) {
        let modalContent = `
            <span class="close" onclick="closeEditModal()">&times;</span> <!-- X 닫기 버튼 추가 -->
        `;

        switch (field) {
            case 'nickname':
                modalContent += `
                    <h4>닉네임 수정</h4>
                    <input type="text" id="editNickname" placeholder="새 닉네임" required>
                    <button id="saveNickname">저장</button>
                `;
                break;
            case 'email':
                modalContent += `
                    <h4>이메일 수정</h4>
                    <input type="email" id="editEmail" placeholder="새 이메일" required>
                    <button id="saveEmail">저장</button>
                `;
                break;
            default:
                return;
        }

        const modal = document.getElementById('editModal');
        const content = modal.querySelector('.modal-content');
        content.innerHTML = modalContent;
        modal.style.display = 'flex'; // 모달 열기

        // 저장 버튼 클릭 이벤트 추가 (한 번만 추가되도록 조치)
        setTimeout(() => {
            document.getElementById(`save${field.charAt(0).toUpperCase() + field.slice(1)}`)
                .addEventListener("click", () => saveEdit(field));
        }, 10);
    }

    // 🔹 정보 저장
    function saveEdit(field) {
        let inputValue;
        let updateField;

        if (field === 'nickname') {
            inputValue = document.getElementById('editNickname').value;
            updateField = 'nickname';
        } else if (field === 'email') {
            inputValue = document.getElementById('editEmail').value;
            updateField = 'email';
        } else {
            return;
        }

        // 🔹 서버로 닉네임(또는 이메일) 변경 요청 보내기
        fetch(`/user/mypage/update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                field: updateField,
                value: inputValue
            })
        })
        .then(response => {
            if (!response.ok) {
                // 상태 코드가 200 ~ 299 범위가 아니면 오류 처리
                return response.json().then(data => {
                    throw new Error(data.message || `서버에서 오류가 발생했습니다. 상태 코드: ${response.status}`);
                });
            }
            return response.json(); // JSON 응답 처리
        })
        .then(data => {
            if (data.success) {
                // 서버에서 받은 메시지 출력
                alert(data.message);

                // 화면에 즉시 반영
                if (field === 'nickname') {
                    const currentNickname = document.getElementById('currentNickname');
                    if (currentNickname) {
                        currentNickname.innerText = inputValue;
                    }
                } else if (field === 'email') {
                    const currentEmail = document.getElementById('currentEmail');
                    if (currentEmail) {
                        currentEmail.innerText = inputValue;
                    }
                }
                closeEditModal(); // 모달 닫기
            } else {
                showErrorModal(data.message); // 오류 발생 시 메시지 모달 표시
            }
        })
        .catch(error => {
            console.error("An error occurred while updating: ", error.message);
            showErrorModal(error.message);
        });
    }

    // 🔹 모달 닫기
    function closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'none'; // 모달 숨기기
        }
    }

    // 🔹 오류 모달 닫기
    function closeErrorModal() {
        const modal = document.getElementById('errorModal');
        if (modal) {
            modal.classList.add('hidden'); // 모달 숨기기
        }
    }

    // 모달 메세지 표시하는 함수
    function showErrorModal(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.innerText = message; // 메시지 설정
        const modal = document.getElementById('errorModal');
        modal.classList.remove('hidden'); // 모달 열기
    }

    // URL 체크
    if (window.location.pathname === '/user/mypage/change_password') {
        modal.classList.remove('hidden'); // 모달 열기
        }

    // 비밀번호 수정 모달 열기 (DOMContentLoaded 이벤트 안에 정의- window. 붙어야)
    window.openChangePasswordModal = function() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.classList.remove('hidden'); // 'hidden' 클래스를 제거하여 모달 열기
            modal.classList.add('show'); // 'show' 클래스를 추가하여 모달 표시
        }
    }

    // 비밀번호 수정 모달 닫기
    window.closeChangePasswordModal = function() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.classList.add('hidden'); // 모달 닫기
            modal.classList.remove('show'); // 필요하면 'show' 클래스 제거
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newPasswordConfirm').value = '';
        }
    }

    function changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;

        // 모든 필드 입력 확인
        if (!currentPassword || !newPassword || !newPasswordConfirm) {
            alert("모든 필드를 입력하세요.");
            return;
        }

        // 새 비밀번호와 확인 비밀번호가 동일한지 확인
        if (newPassword !== newPasswordConfirm) {
            alert("새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.");
            return;
        }

        // 새 비밀번호가 현재 비밀번호와 일치하지 않는지 확인
        if (newPassword === currentPassword) {
            alert("새 비밀번호는 현재 비밀번호와 동일할 수 없습니다.");
            return;
        }

        // 비밀번호 변경 요청
        fetch('/user/mypage/change_password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `currentPassword=${encodeURIComponent(currentPassword)}&newPassword=${encodeURIComponent(newPassword)}`
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || `서버에서 오류가 발생했습니다. 상태 코드: ${response.status}`);
                });
            }
            return response.text();
        })
        .then(data => {
            alert("Your password has been successfully changed.");
            closeChangePasswordModal(); // 모달 닫기
        })
        .catch(error => {
            console.error("Error during password change: ", error);
            alert("An error occurred while changing the password.");
        });
    }

    // 회원 탈퇴 버튼 클릭 이벤트
    document.getElementById('deleteAccountButton').addEventListener('click', function () {
        if (confirm("Are you sure you want to delete your account?")) {
            fetch('/user/deleteAccount', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Account deletion failed.");
                }
                return response.json();
            })
            .then(data => {
                alert(data.message); // 서버에서 받은 응답 메시지 알림
                window.location.href = "/";
            })
            .catch(error => {
                console.error("Error during upload: ", error);
                alert("An error occurred during the upload.");
            });
        }
    });

    // 🔹 전역에서 접근할 수 있도록 함수 등록
    window.openProfileImageModal = openProfileImageModal;
    window.closeProfileImageModal = closeProfileImageModal;
    window.openEditModal = openEditModal;
    window.togglePasswordForm = togglePasswordForm;
    window.closeEditModal = closeEditModal;
    window.closeErrorModal = closeErrorModal;
    window.changePassword = changePassword;
});
