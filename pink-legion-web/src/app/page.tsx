export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Pink Legion
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistema de Gestão Automotiva
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Gerencie vendas, contratos, pagamentos e documentos de forma eficiente e organizada.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <a
            href="/login"
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
          >
            Fazer Login
          </a>
          <a
            href="/register"
            className="border-2 border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
          >
            Criar Conta
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-pink-600 text-2xl">🚗</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestão de Carros</h3>
            <p className="text-gray-600 text-sm">
              Controle completo do estoque de veículos
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clientes</h3>
            <p className="text-gray-600 text-sm">
              Cadastro e acompanhamento de clientes
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pagamentos</h3>
            <p className="text-gray-600 text-sm">
              Controle financeiro e parcelas
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 text-2xl">📄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentos</h3>
            <p className="text-gray-600 text-sm">
              Gestão de contratos e documentação
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Credenciais de Demonstração
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-mono text-gray-900">vinicius.novato@institutoareluna.pt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Senha:</span>
              <span className="font-mono text-gray-900">123456</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Função:</span>
              <span className="text-red-600 font-semibold">Administrador</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500">
          <p>&copy; 2024 Pink Legion. Sistema de gestão automotiva.</p>
        </footer>
      </div>
    </div>
  );
}
