// العناصر الرئيسية للصفحات
const profilePage = document.getElementById('profilePage');
const productsPage = document.getElementById('productsPage');
const addProductPage = document.getElementById('addProductPage');

// أزرار التنقل
const profileBtn = document.getElementById('profileBtn');
const productsBtn = document.getElementById('productsBtn');
const addProductBtn = document.getElementById('addProductBtn');

// نموذج إضافة المنتجات
const addProductForm = document.getElementById('addProductForm');
const productsSection = document.getElementById('allProducts');
const noProductsMessage = document.getElementById('noProductsMessage');

// profile
const accountInfoBtn = document.getElementById('accountInfoBtn');
const myProductsBtn = document.getElementById('myProductsBtn');
const accountInfo = document.getElementById('accountInfo');
const myProducts = document.getElementById('myProducts');
const profileFirstName = document.getElementById('profileFirstName');
const profileLastName = document.getElementById('profileLastName');
const profileUserName = document.getElementById('profileUserName');
const profilePassword = document.getElementById('profilePassword');
const profileEmail = document.getElementById('profileEmail');
const userProductsList = document.getElementById('userProductsList');
const noUserProductsMessage = document.getElementById('noUserProductsMessage');

// عرض معلومات الحساب من localStorage
const user = JSON.parse(localStorage.getItem('user'));
if (user) {
    profileFirstName.textContent = user.firstName;
    profileLastName.textContent = user.lastName;
    profileUserName.textContent = user.userName;
    profileEmail.textContent = user.email;
    profilePassword.textContent = user.password.isDisplayed;
}

// وظيفة إظهار القسم المحدد
function showProfileSection(section) {
    accountInfo.classList.add('hidden');
    myProducts.classList.add('hidden');
    section.classList.remove('hidden');
}

// عند الضغط على "معلومات الحساب"
accountInfoBtn.addEventListener('click', () => showProfileSection(accountInfo));

// عند الضغط على "منتجاتي"
myProductsBtn.addEventListener('click', () => {
    showProfileSection(myProducts);
    displayUserProducts();
});

// وظيفة تبديل الصفحات
function showPage(pageToShow) {
    const pages = [profilePage, productsPage, addProductPage];

    pages.forEach(page => {
        page.classList.add('hidden');
        page.style.opacity = '0';
    });

    pageToShow.classList.remove('hidden');
    setTimeout(() => {
        pageToShow.style.opacity = '1';
    }, 100);
}

// ربط أزرار التنقل
profileBtn.addEventListener('click', () => showPage(profilePage));
productsBtn.addEventListener('click', () => showPage(productsPage));
addProductBtn.addEventListener('click', () => showPage(addProductPage));

// جلب المنتجات من قاعدة البيانات عند تحميل الصفحة
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();

        productsSection.innerHTML = '';

        if (products.length === 0) {
            noProductsMessage.style.display = 'block';
        } else {
            noProductsMessage.style.display = 'none';
            products.forEach(product => displayProduct(product));
        }
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
    }
}

document.addEventListener('DOMContentLoaded', fetchProducts);

// إضافة المنتجات إلى قاعدة البيانات
addProductForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const price = document.getElementById('productPrice').value;
    const images = [];

    for (let i = 1; i <= 5; i++) {
        const imageInput = document.getElementById(`productImage${i}`);
        if (imageInput.files[0]) {
            images.push(URL.createObjectURL(imageInput.files[0]));
        }
    }

    if (!name || !description || price <= 0) {
        alert('يرجى ملء جميع الحقول بشكل صحيح.');
        return;
    }

    if (!user) {
        alert('يجب تسجيل الدخول لإضافة المنتجات');
        return;
    }

    const productData = {
        name,
        description,
        price,
        images,
        owner: user.email
    };

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
          const newProduct = await response.json();
          displayProduct(newProduct.product);
      
          // إعادة تعيين جميع الحقول في الفورم
          addProductForm.reset();
      
          // إعادة تعيين حاوية الصور وإعادة بناء الأزرار
          const imageUploadContainer = document.getElementById('imageUploadContainer');
          imageUploadContainer.innerHTML = ''; // مسح محتوى الحاوية
      
          for (let i = 1; i <= 5; i++) {
              const label = document.createElement('label');
              label.setAttribute('for', `productImage${i}`);
              label.classList.add('upload-btn'); // يمكنك إضافة كلاس CSS للحفاظ على التنسيق
              label.textContent = `رفع صورة ${i}`;
      
              const input = document.createElement('input');
              input.type = 'file';
              input.id = `productImage${i}`;
              input.accept = 'image/*';
      
              // إعادة إضافتهم للحاوية
              imageUploadContainer.appendChild(label);
              imageUploadContainer.appendChild(input);
          }
      
          alert('تمت إضافة المنتج بنجاح!');
      
        } else {
            alert('حدث خطأ أثناء إضافة المنتج.');
        }
    } catch (error) {
        console.error('خطأ في إرسال المنتج:', error);
    }
});

// عرض المنتج في الواجهة
function displayProduct(product) {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product');
    productDiv.dataset.id = product._id;

    let imagesHTML = '';
    product.images.forEach(img => {
        imagesHTML += `<img src="${img}" alt="صورة المنتج" style="width: 100px; height: 100px; margin: 5px; border-radius: 10px;">`;
    });

    productDiv.innerHTML = `
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p>السعر: ${product.price} ريال</p>
        <div class="product-images">${imagesHTML}</div>
        <button class="purchase-btn" onclick="purchaseProduct()">شراء</button>    `;

    productsSection.appendChild(productDiv);
}

// حذف المنتج من قاعدة البيانات
async function deleteProduct(productId, button) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            button.parentElement.remove();
            alert('تم حذف المنتج بنجاح!');
        } else {
            alert('حدث خطأ أثناء حذف المنتج.');
        }
    } catch (error) {
        console.error('خطأ أثناء حذف المنتج:', error);
    }
}

// وظيفة شراء المنتج
function purchaseProduct() {
    alert('تم شراء المنتج بنجاح!');
}

// تبديل زر رفع الصورة بالصورة المرفوعة
const imageInputs = document.querySelectorAll('#imageUploadContainer input[type="file"]');

imageInputs.forEach(input => {
    input.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const imageUrl = URL.createObjectURL(this.files[0]);

            const imageElement = document.createElement('img');
            imageElement.src = imageUrl;
            imageElement.alt = 'صورة مرفوعة';
            imageElement.style.width = '100px';
            imageElement.style.height = '100px';
            imageElement.style.margin = '5px';
            imageElement.style.borderRadius = '10px';
      
            // استبدال الزر بالصورة
            const label = this.previousElementSibling; // الوصول إلى التسمية السابقة لزر الرفع
            label.style.display = 'none'; // إخفاء التسمية
            this.style.display = 'none'; // إخفاء المدخل
            label.parentElement.appendChild(imageElement); // إضافة الصورة إلى نفس العنصر الأب
          }
        });
      });
      // إنشاء عنصر عرض الصورة
      const imagePreviewContainer = document.createElement('div');
      imagePreviewContainer.id = 'imagePreviewContainer';
      imagePreviewContainer.style.position = 'fixed';
      imagePreviewContainer.style.top = '0';
      imagePreviewContainer.style.left = '0';
      imagePreviewContainer.style.width = '100vw';
      imagePreviewContainer.style.height = '100vh';
      imagePreviewContainer.style.background = 'rgba(0, 0, 0, 0.7)';
      imagePreviewContainer.style.display = 'none';
      imagePreviewContainer.style.justifyContent = 'center';
      imagePreviewContainer.style.alignItems = 'center';
      imagePreviewContainer.style.zIndex = '1000';
      
      // إنشاء زر الإغلاق
      const closeButton = document.createElement('button');
      closeButton.innerText = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '20px';
      closeButton.style.right = '30px';
      closeButton.style.fontSize = '30px';
      closeButton.style.color = '#fff';
      closeButton.style.background = 'transparent';
      closeButton.style.border = 'none';
      closeButton.style.cursor = 'pointer';
      
      // إنشاء عنصر الصورة داخل العرض
      const previewImage = document.createElement('img');
      previewImage.style.maxWidth = '90%';
      previewImage.style.maxHeight = '90%';
      previewImage.style.borderRadius = '10px';
      previewImage.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
      
      // إضافة عناصر العرض إلى الصفحة
      imagePreviewContainer.appendChild(previewImage);
      imagePreviewContainer.appendChild(closeButton);
      document.body.appendChild(imagePreviewContainer);
      
      // إظهار الصورة عند الضغط عليها
      document.addEventListener('click', function (event) {
        if (event.target.tagName === 'IMG' && event.target.closest('.product-images')) {
          previewImage.src = event.target.src;
          imagePreviewContainer.style.display = 'flex';
        }
      });
      
      // إغلاق العرض عند الضغط على زر الإغلاق
      closeButton.addEventListener('click', function () {
        imagePreviewContainer.style.display = 'none';
      });

      
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', function() {
  // إعادة التوجيه إلى صفحة تسجيل الدخول
  window.location.href = 'index.html';
});

// وظيفة لجلب المنتجات الخاصة بالمستخدم الحالي
async function fetchUserProducts() {
  if (!user) {
      alert('يجب تسجيل الدخول لعرض منتجاتك');
      return;
  }

  try {
      const response = await fetch(`/api/user/products?email=${user.email}`);
      const products = await response.json();

      userProductsList.innerHTML = '';

      if (products.length === 0) {
          noUserProductsMessage.style.display = 'block';
      } else {
          noUserProductsMessage.style.display = 'none';
          products.forEach(product => displayUserProduct(product));
      }
  } catch (error) {
      console.error('خطأ في تحميل منتجات المستخدم:', error);
  }
}

// عرض المنتج في صفحة "منتجاتي"
function displayUserProduct(product) {
  const productDiv = document.createElement('div');
  productDiv.classList.add('product');
  productDiv.dataset.id = product._id;

  let imagesHTML = '';
  product.images.forEach(img => {
      imagesHTML += `<img src="${img}" alt="صورة المنتج" style="width: 100px; height: 100px; margin: 5px; border-radius: 10px;">`;
  });

  productDiv.innerHTML = `
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p>السعر: ${product.price} ريال</p>
      <div class="product-images">${imagesHTML}</div>
      <button class="delete-btn" onclick="deleteProduct('${product._id}', this)">🗑 حذف</button>
  `;

  userProductsList.appendChild(productDiv);
}

// عند الضغط على "منتجاتي"، يتم تحميل المنتجات الخاصة بالمستخدم
myProductsBtn.addEventListener('click', () => {
  showProfileSection(myProducts);
  fetchUserProducts();
});
